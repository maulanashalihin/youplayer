<script>
  import {
    onMount
  } from "svelte";
  import {
    isMobileOrTable
  } from "./helper";






  let config = {
    height: 390,
    width: 640,
    playerVars: {
      'controls': 0
    }
  }


  let PlayerHeight = config.height;

  let isFullscreen = false;

  export let videoId = 'qBeAUyuctHM';

  export let el; 
  
  let player = {};

  config.videoId = videoId;

  // set methods
  config.events = {
    'onStateChange': onPlayerStateChange,
    'onReady': onPlayerReady,
  }

  let playButton = true;
  let ready = false;
  let toolbar = false;
  let PlayerWidth = config.width;
  let rotate = false;


  onMount(() => {

    const offsetWidth = document.querySelector(el).offsetWidth
    config.width = offsetWidth;
    config.height = Math.floor(offsetWidth / 16 * 9)
    PlayerWidth = config.width;
    PlayerHeight = config.height;

    window.addEventListener("orientationchange", function () {

      if (isFullscreen) {

        isFullscreen = true;
        PlayerWidth = window.screen.width;
        PlayerHeight = window.screen.height;

        player.setSize(PlayerWidth, PlayerHeight)

      } else {
        const iframe = document.querySelector('iframe');
        iframe.style.width = '100%';
        setTimeout(() => {
          const offsetWidth = document.querySelector('iframe').offsetWidth
          config.width = offsetWidth;
          config.height = Math.floor(offsetWidth / 16 * 9)
          PlayerWidth = config.width;
          PlayerHeight = config.height;
          player.setSize(PlayerWidth, PlayerHeight)
        }, 200)
      }



    }, false);

  })
  // end mounted

  function onPlayerReady() {
    ready = true;
  }

  function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING || event.data == YT.PlayerState.BUFFERING) {
      playButton = false;
    } else {
      playButton = true;
      toolbar = true;
    }
  }



  let randomId = (Math.random() + 1).toString(36).substring(7);


  const checker = setInterval(() => {
    if (typeof YT == 'object') {
      player = new YT.Player(randomId, config);;
      clearInterval(checker)
    }
  }, 100)


  let persentageVideo = 0;
  // @ts-ignore


  setInterval(() => {

    if (!playButton) {
      // console.log(player.getCurrentTime())
      // console.log(player.getDuration())
      persentageVideo = Math.floor(player.getCurrentTime() / player.getDuration() * 100)
      // console.log(persentageVideo)
    }
  }, 1000)


  document.addEventListener('fullscreenchange', (event) => {
    // @ts-ignore
    if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document
      .msFullscreenElement) {
      ///fire your event
      isFullscreen = false;
      PlayerWidth = config.width;
      PlayerHeight = config.height;
      document.exitFullscreen();
      player.setSize(PlayerWidth, PlayerHeight)
    }
  });


 

  function playOrPause() {
    if (playButton == false) {
      player.pauseVideo()
    } else {
      player.playVideo()
    }
  }

  function seekProgress(e) {
    const Duration = player.getDuration();
    const result = (e.layerX / e.target.offsetWidth * Duration)

    player.seekTo(result, true)
    persentageVideo = Math.floor(result / Duration * 100)
  }



  function makeFullScreen() {
    if (isFullscreen) {
      isFullscreen = false;
      PlayerWidth = config.width;
      PlayerHeight = config.height;
      document.exitFullscreen();
    } else {

      document.body.requestFullscreen();

      isFullscreen = true;
      PlayerWidth = window.screen.width;
      PlayerHeight = window.screen.height;

      if (isMobileOrTable() && PlayerHeight > PlayerWidth) {
        PlayerHeight = window.screen.height - 20;
      }

    }
    player.setSize(PlayerWidth, PlayerHeight)

  }

  let triggerTime = 0;
  setInterval(() => {

    if (!playButton) {
      if (triggerTime <= 0) {
        toolbar = false;
      }

      triggerTime -= 100;
    }

  }, 100)

  // overide methods
  export function loadVideo(video_id) {
    player.loadVideoById(video_id)
  }

  export function pauseVideo() {
    player.pauseVideo()
  }

  export function playVideo() {
    player.playVideo()
  }
</script>

<div class="bg-black">
  <div id="check-width" class="relative bg-black       {rotate ? '  ' : ''}" style=" height : {PlayerHeight}px">
    <div class=" absolute " id="{randomId}"></div>
    <div class="absolute z-10 " on:mousemove="{()=>{toolbar = true;triggerTime = 3000}}"
      on:mouseleave="{()=>{toolbar = false;}}" style="width : {PlayerWidth}px; height : {PlayerHeight}px">

      <div class="flex justify-center  " on:click="{playOrPause}" style="height: {Math.floor(PlayerHeight)}px;{playButton && ready ? 'background: linear-gradient(black, rgba(0,0,0,0),rgba(0,0,0,0),rgba(0,0,0,0),rgba(0,0,0,0), black, black)' : ''};
    ">
        {#if playButton}
             <!-- content here -->
             <button on:click="{playVideo}"  class="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          {/if}
        
        </div>
        {#if toolbar}
        <div class="absolute   w-full bottom-0 left-0 z-20">
          <div class="flex p-3 gap-2">
            {#if playButton}
               <!-- content here -->
             
            <div><button on:click="{playVideo}"class="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button></div>
            {:else}
            <div><button on:click="{playOrPause}" class="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button></div>
            
            {/if}
          
            <div class="w-full cursor-pointer  rounded-full h-2 mt-2 relative" >
              <div class="bg-gray-200 absolute h-2 rounded-full opacity-25  w-full"  ></div>
              
              <div class="bg-blue-600 absolute h-2 rounded-full  " style="width: {persentageVideo}%"></div>
              <div class="w-full absolute   h-2" on:click="{seekProgress}"></div>
            </div>
            
            <div>
              <button class="text-white" on:click="{makeFullScreen}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/if}
        
      </div>
    
    
    </div>
     
 </div>