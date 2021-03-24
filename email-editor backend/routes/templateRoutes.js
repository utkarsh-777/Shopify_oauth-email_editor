const express = require('express');
const router = express.Router();
const Template = require('../models/templates');

router.post('/save-template',(req,res)=>{
    if(!req.body.data){
        return res.json({error:"Template not found!"})
    }

    const data = JSON.parse(req.body.data)
    Template.findOne({name:data.name})
        .then(temp=>{
            if(temp){
                Template.findByIdAndUpdate({_id:temp._id},{
                    $set:{template:JSON.stringify(data.design)}
                },{new:true},(err,result)=>{
                    if(err){
                        return res.json(err);
                    }
                    return res.json(result);
                })
            }
            else{
                const newTemplate = new Template({
                    name:data.name,
                    template:JSON.stringify(data.design)
                });
            
                newTemplate.save()
                    .then(resu=>{
                        return res.status(200).json(resu);
                    })
                    .catch(err=>console.log(err))
            }
        })
});

router.get('/list-projects',(req,res)=>{
    Template.find()
        .then(data=>{
            if(!data){
                return res.json({error:"No template!"})
            }
            return res.json(data)
        })
});

router.post('/get-project',(req,res)=>{
    Template.findOne({name:req.body.data})
        .then(temp => {
            if(!temp){
                return res.json({error:"Not found!"})
            }
            return res.json(temp)
        }).catch(err=>{
            return res.json(err)
    })
});

module.exports = router;