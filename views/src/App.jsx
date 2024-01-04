import { useState , useEffect, useRef} from 'react'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import *  as THREE from 'three'

function App() {
  const containerRef = useRef(); 
  const cameraRef = useRef(); 
  const rendererRef = useRef(); 

  const [passedCount, setPassedCount] = useState(0); 
  const [players, setPlayers] = useState([]); 
  const [isGameStart, setGameStart] = useState(true);
  const [isGameOver, setGameOver] = useState(false); 
  const [isRestart, setRestart] = useState(false); 
  const [userData, setUserData] = useState({});  
  const [original, setOriginal] = useState({});
  
  useEffect(() =>{
     const retrieveStats = async () =>{
       try{
        const req = await fetch('http://localhost:5000/stats', {method:'GET'}); 
        const res = await req.json(); 

        setPlayers(res.users); 
       } catch(e){
        console.log(e.message)
       }
     }

     retrieveStats(); 
  },[])
   
  function handleUserData(e){
    const name = e.target.name; 
    const value = e.target.value; 

    setUserData((prev) => ({
      ...prev,
      [name]:value
    }))

  }

  async function handleSaveUser(){
    const data = JSON.stringify({...userData, score:passedCount}); 
    console.log(data); 
     try{
      const req = await fetch('http://localhost:5000/save', {
        method:'POST', 
        headers:{
          'Content-Type':'application/json'
        },
        body:data
      })
      const res = await req.json(); 
      if(!res.ok){
        throw new Error(res.msg)
      }
      setGameStart(false); 
      localStorage.setItem('user', userData.username);
      
      const gameDiv = document.querySelector('.game-canvas')
      gameDiv.classList.remove('start'); 
     } catch(e){
       console.log(e)
     }
  }
   
  async function submitUserData(){
    const data = JSON.stringify({...userData, score:passedCount}); 
    try{
      const req = await fetch('http://localhost:5000/save/stats', {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:data
      }); 
      const res = await req.json(); 
      if(!res.ok){
        throw new Error(res.msg)
      }
      console.log('Submitted'); 
    } catch(e){
      console.log(e); 
    }
  }

  useEffect(() =>{
     if(isGameOver){
       submitUserData();
     } 
  },[isGameOver])

  function startGame(cube){
    if(!isGameStart){
    cube.disable = false; 
    cube.gameStart = false;
    cube.gameOver = false; 

    } 
  }

  function restartGame(cube,camera,ground){
    if(isRestart){
      cube.disable = false; 
      cube.gameOver = false; 


      cube.position.x = cube.originalPositions.x; 
      cube.position.y = cube.originalPositions.y; 
      cube.position.z = cube.originalPositions.z; 


      camera.position.x = cube.originalPositions.cameraX
      camera.position.y = cube.originalPositions.cameraY
      camera.position.z = cube.originalPositions.cameraZ; 
      
      ground.position.x = original.x ; 
      ground.position.y = original.y; 
      ground.position.z = original.z; 

      
      setGameOver(false);
      setRestart(false); 
      console.log('game restarted')
    }
  }

  function restart(){
    const gameOverHeader = document.querySelector('.game-header'); 
    gameOverHeader.classList.toggle('hidden',true);

    setRestart(true); 
  }

  class Box extends THREE.Mesh{
    constructor(width,height,depth,color,camera,velocity = {
      x:0,
      y:0,
      z:0
    }, position = {
      x:0,
      y:0,
      z:0
    }, rotation = {
      x:0,
      y:0,
      z:0
    },disabled = true,movingForward = false, movingBackward = false){
      const geo = new THREE.BoxGeometry(width,height,depth); 
      const mats = new THREE.MeshStandardMaterial({color})
      super(geo,mats)
       
      this.position.set(position.x,position.y,position.z); 
      this.rotation.set(rotation.x,rotation.y,rotation.z); 
      
      this.bottom = this.position.y - (height / 2); 
      this.top = this.position.y + (height / 2); 
     
      this.right = this.position.x + (width / 2); 
      this.left = this.position.x - (width / 2) 

      this.width = width; 
      this.height = height;
      this.depth = depth; 
      
      this.velocity = velocity
      this.gravity = -0.01;
      this.accelerate = 0; 
      this.accelerateX = 0; 

      this.disable = disabled; 
      this.camera = camera;
      
      this.gameStart = true; 
      this.gameOver = false; 
      this.movingForward = movingForward; 
      this.passed = false; 
      this.isPowerUp = false; 
      

      this.originalPositions = {x:this.position.x,y:this.position.y,z:this.position.z, 
        cameraX:camera.position.x,cameraY:camera.position.y,cameraZ:camera.position.z}; 
      
      
    }
    
    updateSides(group){
      
      this.bottom = this.position.y - (this.height / 2); 
      this.top = this.position.y + (this.height / 2); 
     
      this.right = this.position.x + this.width / 2; 
      this.left = this.position.x - this.width / 2; 

      const sides = {
        top:this.top,
        bottom:this.bottom, 
        right:this.right,
        left:this.left
      }
      const groundRight = group.ground.position.x + (group.ground.width / 2); 
      const groundLeft = group.ground.position.x - (group.ground.width / 2); 
      const groundTop = group.ground.position.y + (group.ground.depth / 2); 
      const groundBottom = group.ground.position.y - (group.ground.depth / 2);
      const groundFront = group.ground.position.z - (group.ground.height / 2); 
      const groundBack = group.ground.position.z + (group.ground.height / 2);  


      const groundMetrics = {
        right:groundRight,
        left:groundLeft,
        top:groundTop,
        bottom:groundBottom,
        front:groundFront,
        back:groundBack
      }
      
   
      return { sides, ground:groundMetrics}
     
      //console.log(sides); 
    }
    update(group){

     const metrics =  this.updateSides(group); 
      

      const topPlane = group.ground.position.y + (group.ground.height / 2);
      const distance = -topPlane - .4; 
      
      this.bottom = this.position.y - (this.height / 2); 
      this.top = this.position.y + (this.height / 2);
      
      this.position.x += (this.velocity.x); 
      this.position.z += (this.velocity.z + this.accelerate); 
      

      // detect for collision 
      if(this.position.x < metrics.ground.left){
        this.disable = true; 
        setGameOver(true); 


          this.rotation.z += 0.01;
        
        this.velocity.x -= 0.001;
       if((this.position.x + this.left ) < metrics.ground.left){ 
         this.gravity -= .01; 

       }
      

      }

       if(this.position.x > metrics.ground.right){
        this.disable = true;
        setGameOver(true); 


        this.velocity.x += 0.001; 
        if((this.position.x + this.right) < metrics.ground.right){
          this.gravity -= .01; 
        }

      } 


      if(this.position.z + (metrics.ground.front * 1.25 ) <= metrics.ground.front && this.movingForward && !this.gameOver){
        group.ground.position.z += (this.velocity.z + this.accelerate);
      } 
      
      this.applyGravity(distance); 
      
    }


    applyGravity(distance){

      this.velocity.y += this.gravity; 

      if((this.position.y + this.velocity.y <= distance && !this.disable) || this.gameStart){
        this.velocity.y *= .5
        this.velocity.y = -this.velocity.y; 
      //this.position.y += this.velocity.y;  
     } else {
       this.position.y += this.velocity.y
     }
    
  }

  end(id,id2){
   this.gameOver = true; 
   
   
   const gameOverHeader = document.querySelector('.game-header'); 
       gameOverHeader.classList.toggle('hidden',false);

    
   clearInterval(id)
   clearInterval(id2); 
   setGameOver(true)
  }

  }
  // Is Pressed 
  const keys = {
    left:{
      pressed:false
    },
    right:{
      pressed:false
    },
    up:{
      pressed:false
    },
    down:{
      pressed:false
    }
  }
  // Box Collision 
  function boxCollision(box1,box2){
    let box1FrontFace = box1.position.z + (box1.depth / 2); 
    let box2BackFace = box2.position.z - (box2.depth / 2);
    let box2FrontFace = box2.position.z + (box2.depth / 2);  
    

    let box1BorderRight = box1.position.x + (box1.width / 2); 
    let box1BorderLeft = box1.position.x - (box1.width / 2); 
    
    let box2BorderRight = box2.position.x + (box2.width / 2); 
    let box2BorderLeft = box2.position.x - (box2.width / 2); 

    let rangeZ = box1FrontFace < box2FrontFace && box1FrontFace > box2BackFace; 
    let rangeX = (box1BorderLeft < box2BorderLeft && box1BorderRight > box2BorderLeft) ||
    (box1BorderRight > box2BorderRight && box1BorderLeft < box2BorderRight) 

    if(rangeZ){
       return rangeX;
    }
    

  }
  // Key Down Function 

  function keydown(e,cube){
  
    switch(e.keyCode){
      case 37:
        keys.left.pressed = true
        break; 
      case 38:
        keys.up.pressed = true; 
        break; 
      case 39:
        keys.right.pressed = true;
        break; 
      case 40:
        keys.down.pressed = true; 
        break; 
    } 
  }

  function keyup(e,cube){
    switch(e.keyCode){
      case 37:
        keys.left.pressed = false; 
        break; 
      case 39:
        keys.right.pressed = false; 
        break; 
      case 38:
        keys.up.pressed = false;
        cube.movingForward = false; 
        break; 
      case 40:
        keys.down.pressed = false; 
        break; 
    }
  }

 
  useEffect(() =>{
    const scene = new THREE.Scene(); 
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight, 
      .1,
      1000)
      
      camera.position.z = 10; 
      cameraRef.current = camera; 

    const renderer = new THREE.WebGLRenderer({antialias:true})
    renderer.setClearColor('#000000'); 
    renderer.setSize(window.innerWidth,window.innerHeight); 
    
    renderer.shadowMap.enabled = true; 

    rendererRef.current = renderer; 
    
    const container = containerRef.current; 
    container.appendChild(renderer.domElement); 
    
    
    // Orbit Controls 
 //const orbit = new OrbitControls(camera,renderer.domElement); 

    // Box  
    const cube = new Box(1,1,1,0x00FF00,camera,{
      x:0,
      y:-0.01,
      z:0
    }, 
    {
      x:0,
      y:0, 
      z:3.75
    });
    cube.castShadow = true; 
    scene.add(cube); 

    const ground = new Box(10,15.75,2.5,0x808080,camera,{x:0,y:0,z:0},{x:0,y:-5,z:-1},{x:-1.575,y:0,z:0}); 
    setOriginal({x:0,y:-5,z:-1}); 
   // ground.rotation.y = 0
  //  ground.rotation.x = -1.5;
    ground.receiveShadow = true; 

   scene.add(ground); 
 
    // Light

  const directionalLight = new THREE.DirectionalLight(0xffffff,1.25);
  directionalLight.castShadow = true; 
  directionalLight.position.set(0,3,1);
  scene.add(directionalLight);  
  // Spawn Enemy 

  function spawn(position){
    const enemy = new Box(1,1,1,0xFF0040,camera,{x:0,y:-0.01,z:0},position); 
   enemy.castShadow = true; 
    enemyGroup.add(enemy); 
  }
/*Start Game */
startGame(cube); 
restartGame(cube,camera,ground);

   const enemyGroup = new THREE.Group(); 
   const powerGroup = new THREE.Group(); 
   
   scene.add(powerGroup); 
   scene.add(enemyGroup);

  // Determine Enemy Position 
  function getRandomFloat(min, max, precision) {
    const factor = Math.pow(10, precision);
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function determinePosition(player,ground){
    let borderLeft = ground.position.x - (ground.width / 2);
    let borderRight = ground.position.x + (ground.width /2); 
    let borderFront = ground.position.z - (ground.height / 2); 
    let buff =  1; 
    
    let playerFront = player.position.z - (player.depth / 2); 

    let valueX = getRandomFloat(borderLeft + buff,borderRight - buff,2); 
    let valueZ = getRandomFloat(borderFront + buff,borderFront, 2);
    
    const groundTop = ground.position.y + (ground.depth /  2) + .4; 
    return {x:valueX, y:groundTop,z:valueZ}


  }


  // Spawn Enemy
  function spawnEnemy(id){
        let enemyPosition = determinePosition(cube,ground); 
         spawn(enemyPosition); 
  }
  // Spawn Powerup 
  function spawnPower(){
    let powerPosition = determinePosition(cube,ground); 
    const powerUp = new Box(1,1,1,0x6495ED,camera,{x:0,y:-0.01,z:0}, powerPosition);
    powerUp.isPowerUp = true; 

    powerGroup.add(powerUp); 
  }
  // Update Passed Count; 

  function updatePassedCount(){
     let currentGroup = Array.from(enemyGroup.children); 
     const passedEnemies = currentGroup.filter((cube) => cube.passed); 
     setPassedCount((prev) => passedEnemies.length);
  }
 
  // Accelerate 
  function increaseSpeed(cube){
      // Accelerate
      const cubesPassed = Array.from(enemyGroup.children).filter((box) => box.passed); 
      let multipleOfTen = cubesPassed.length % 10 === 0 && cubesPassed.length >= 10; 
      if(multipleOfTen){
        cube.accelerate -= 0.002
      }
  }
  let powerIntervalID;
  let intervalID; 
 if(!cube.disable){
 intervalID = setInterval(spawnEnemy,500); 
 
 powerIntervalID = setInterval(spawnPower,15000); 
 }
  // adjust Screen 

  function adjustScreen(e){
    renderer.setSize(window.innerWidth, window.innerHeight); 

    camera.aspect = window.innerWidth / window.innerHeight; 
    camera.updateProjectionMatrix; 
  }
   
  window.addEventListener('resize', adjustScreen); 

  
  // Animate 
  const keyDownEvent = (e) => keydown(e,cube)
  const keyUpEvent = (e) => keyup(e,cube); 

    function animate(){
      requestAnimationFrame(animate); 
      
   //  orbit.update(); 
    /*
      cube.rotation.y += 0.01
      cube.rotation.x += 0.01 
      */

      // Add Gravity
      const group= {
        ground:ground
      }

      cube.update(group) 
      rendererRef.current.render(scene,cameraRef.current); 

    if(!cube.disable){
     cube.velocity.x = 0; 
      cube.velocity.z = 0; 
    
      if(keys.left.pressed) cube.velocity.x = (-0.1 + cube.accelerateX); 
       else if(keys.right.pressed) cube.velocity.x = (0.1 - cube.accelerateX);  
  
      
       
        cube.velocity.z = -0.1
        cube.movingForward = true; 

       camera.position.z += (cube.velocity.z + cube.accelerate);  
     
      // Apply Enemy Collision

       const enemies = Array.from(enemyGroup.children); 
       enemies.forEach((box,i) => { 
         const detectCollision = boxCollision(cube, box);
         if(detectCollision){
           cube.disable = true; 
           cube.end(intervalID,powerIntervalID); 
         }

         let enemyBackFace = box.position.z - (box.depth / 2); 
         let playerBackFace = cube.position.z - (box.depth / 2); 

         if(playerBackFace < enemyBackFace){
            box.passed = true; 
         }
       })
      
       // Apply Power Up Collision 
       const powers = Array.from(powerGroup.children); 
       powers.forEach((box) =>{
        const detect = boxCollision(cube,box); 
        if(detect && !cube.disable){
           clearInterval(powerIntervalID); 
           cube.accelerateX += -0.01;

           const powerDiv = document.querySelector('.power'); 
           powerDiv.classList.remove('hidden'); 

           setTimeout(() =>{
             cube.accelerateX = 0;
             powerDiv.classList.add('hidden'); 

            powerIntervalID = setInterval(spawnPower,15000); 
           },10000) 
        }
       })

      } 

        if(!isGameStart && cube.disable && !cube.gameOver){
        cube.end(intervalID,powerIntervalID);
        } 
      
      
      updatePassedCount(); 
      increaseSpeed(cube); 

      window.addEventListener('keydown', keyDownEvent); 
      window.addEventListener('keyup', keyUpEvent); 
    }

    animate(); 

    return () =>{
      window.removeEventListener('keydown', keyDownEvent);
      window.removeEventListener('keyup', keyUpEvent);
      
      clearInterval(intervalID); 
    }
  },[isGameStart, isRestart])

  return (
    <>
    {isGameStart && <div className="gameStart">
      <div>
        <label>Enter Username</label>
        <span>
          <input type="text" placeholder="user123" id="username" name="username" value={userData.name}
          onChange={(e) => handleUserData(e)}/>
          <button onClick={() => handleSaveUser()}>Submit</button> 
        </span> 
      </div>
      </div>}
     <div ref={containerRef} className="game-canvas start"></div>   
     <div className="game start">
       <div className="game-header hidden">
       <h1>Game Over</h1>
       <button onClick={() => restart()}>Restart</button>
       </div>
       <div className="game-count">
       <h1>{passedCount}</h1>
       <p>score</p>
       </div>
       <div className="power hidden">
        <p>Speed Boost</p>
        <div className="power-bar">
        <div></div>
        </div>
       </div>
     </div>
     <div className="legend">
      <div id="l1">
        <div></div>
        <p>Enemy</p>
      </div>
      <div id="l2">
        <div></div>
        <p>Power Up</p>
      </div>
     </div>
     <div className="leaderboard">
       <h1>Leader Board</h1>
       <div className="players">
         {players.map((stat,i) => (
          <div className="stats" key={i}>
           <h3>{stat.name}</h3>
           <h3>{stat.score}</h3>
          </div>
         ))}
       </div>
     </div>
    </>
  )
}

export default App;
