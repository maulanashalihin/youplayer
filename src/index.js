 
import App from './YouPlayer.svelte'
import './index.css'
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
 
 


 function Player(config){
   
  if(!config.el)
   {
      return alert("No dom selector")
   }

   if(!config.videoId)
   {
      return alert("No Youtube Video ID")
   }

   if(!document.querySelector(config.el))
   {
     return alert("No Element with selector "+config.el)
   }
 


   const app = new App({
    target: document.querySelector(config.el),
    props : {
      el : config.el,
      videoId : config.videoId
    }
  })
  return app;
  
}
 
window.YouPlayer = Player;

export default Player;