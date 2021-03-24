import React, { useEffect, useRef,useState } from 'react';
import axios from "axios";
import EmailEditor from 'react-email-editor';

import 'semantic-ui-css/semantic.min.css';
import 'react-toastify/dist/ReactToastify.css';

import { ToastContainer, toast } from 'react-toastify';

import {
  Input,
  Form,
  Container,
  Button,
  TextArea,
  Card,
  Grid
} from "semantic-ui-react";

const App = (props) => {

  const emailEditorRef = useRef(null);
  const [html,setHtml] = useState('');
  const [project,setProject] = useState('');
  const [savedProjects,setSavedProjects] = useState([])

  useEffect(()=>{
    axios.get('http://localhost:8081/api/list-projects')
      .then(resu=>{
        const arr = []
        resu.data.map(item=>(
          arr.push(item.name)
        ));
        setSavedProjects(arr)
      })
  },[project,savedProjects])

  const exportHtml = () => {
    emailEditorRef.current.editor.exportHtml((data) => {
      const { html } = data;
      setHtml(html);
      return toast('Html Generated! Go to the bottom of the page',{type:'info'})
    });
  };

  const onLoad = (item) => {
    if(item){
      setProject(item);
        axios.post('http://localhost:8081/api/get-project',{
          data:item
        })
      .then(result=>{
        console.log(JSON.parse(result.data.template));
        emailEditorRef.current.editor.loadDesign(JSON.parse(result.data.template));
        return toast('Loaded Succesfully check the editor!',{type:'dark'})
      })
    }
    return emailEditorRef.current.editor.loadDesign('')
  };

  const save = () => {
    emailEditorRef.current.editor.exportHtml((data) => {
      const {design} = data;
      if(project){
        axios.post("http://localhost:8081/api/save-template",{
        data:JSON.stringify({
          name:project,
          design:design
        })
      }).then(data=>{
        setProject(project);
        return toast(`Saved Successfully!`,{type:'success'})
      })
      }else{
        return toast('Enter the project name!',{type:'error'})
      }
    })
  };

  const newProject = () => {
    setHtml('')
    setProject('')
    onLoad();
    return toast('New Project!',{type:'default'})
  }

  return (
    <div className="App">
    <ToastContainer />
      <Container>
      <h2 style={{marginTop:"40px"}} >Email Editor App</h2>
      <Form>
        <label>Project Name</label>
        <Form.Field>
          <Input required placeholder="Project name" value={project} onChange={e=>setProject(e.target.value)}/>
        </Form.Field>
        <Button type='submit' onClick={save}>Save</Button>
        <Button onClick={exportHtml}>Export HTML</Button>
        {project && <Button onClick={()=>newProject()}>New Project</Button>}
      </Form>

      <h3 style={{marginTop:"30px"}}>Saved Projects</h3>
      <hr></hr>
      <Grid loading columns={3}>
      <Grid.Row>
        {savedProjects && savedProjects.map(item=>(
          <Grid.Column key={item}> 
            <Card key={item} link header={item} onClick={()=>onLoad(item)} style={{width:"100%"}} style={{marginTop:"20px",marginBottom:"15px"}} /> 
          </Grid.Column>
        ))}
        
      </Grid.Row>
    </Grid>
    </Container>
    <EmailEditor
        style={{marginTop:"30px",height:"800px"}}
        ref={emailEditorRef}
        onLoad={onLoad}
      />  
    <Container style={{marginTop:"20px"}}>
    {html && 
      <Form>
      <h3>Generated html code</h3>
      <hr/>
      <TextArea value={html} style={{minHeight:'600px',marginBottom:"60px"}} />
      </Form>
    }

    </Container>
    </div>
  );
};

export default App;