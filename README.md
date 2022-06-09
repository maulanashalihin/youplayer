
# YouPlayer

  

YouPlayer is perfect Youtube Player wrapper. Every link that make user go straight to youtube is disable. so, user always stay on your website to watch exclusive content.

  

**1. Installation** <br> 

    npm i youplayer

  
  <br>

**2. Import Project** <br> 

    import YouPlayer from "youplayer"
    import "youplayer/dist/style.css"

  <br>
  
**3. CDN Installation** <br>
    
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/youplayer/dist/style.css">
    <script src="https://cdn.jsdelivr.net/npm/youplayer"></script>
        
<br>
  
**4. Usage**  <br>


    <div id="video"></div>
    
    <script>
        const app = YouPlayer({
          el : "#video",
          videoId : "_7EwGJmjT5E"
        })
    </script>

 <br>  

**4. Methods**<br>

you can use  method below to change player experience. usage example : 

    app.loadVideo("SkIk7txs1aY")

 | method name  | description |
| ------------- |:-------------:|
| loadVideo(videoId : string)      | to change video on existing player    |
| playVideo()      | to play video     | 
| pauseVideo()      | to pause video     | 
| stopVideo()      | to stop video     | 
  
 
 <br>
  
**5. Demo** <br>
<a href="https://demo-youplayer.netlify.app/" target="_blank">Live Demo</a> 

<br>
 

## Thank You

This library built using `vite, tailwind css and svelte`.