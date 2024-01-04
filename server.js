require("dotenv").config(); 
const express = require('express'); 
const app = express(); 
const cors = require("cors"); 
const fs = require("fs"); 

app.use(express.json()); 
app.use(express.urlencoded({extended:true})); 

app.use(cors({origin:"*"})); 
const port = process.env.PORT



app.post('/save', (req,res) =>{
    console.log(req.body); 
    const user = req.body.username;  

    const getStats = fs.readFileSync('users.json','utf8'); 
    const parsed = JSON.parse(getStats); 
    
    const findUser = parsed.users.find((u) => u.name === user); 
    if(!findUser){
        parsed.users.push({name:user, score:req.body.score}); 
    }
    
    const viable = JSON.stringify({users:parsed.users});
    fs.writeFile('users.json',viable,(err) =>{
        if(err){
            console.log(err); 
        }
    }); 
    return res.status(200).json({ok:true})
})


app.put('/save/stats', (req,res) =>{
    const data = req.body; 
    const score = parseInt(data.score); 

    const getStats = fs.readFileSync('users.json', 'utf8'); 
    const parsed = JSON.parse(getStats); 
    const user = parsed.users.findIndex((u) => u.name === data.username);
    
    if(user < 0){
      return res.status(500).json({ok:false, msg:'User Not Found'})
    }
    if(!parsed.users[user]["score"] || parsed.users[user]["score"] < score){
        parsed.users[user]["score"]  = score; 
    }
    
    const viable = JSON.stringify(parsed); 
    fs.writeFile('users.json',viable, (err) =>{
        if(err){
            console.log(err); 
        }
    }); 

    return res.status(200).json({ok:true}); 
})


app.get('/stats', (req,res) =>{
    try{
    const data  = fs.readFileSync('users.json', 'utf8'); 
    const parsed = JSON.parse(data); 
    
    console.log(parsed); 
    return res.status(200).json(parsed);
    } catch(e){
        console.log(e); 
    } 
})

app.listen(port, () => console.log(`listening @ ${port}`))
