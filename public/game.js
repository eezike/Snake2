/*
  FIXES!
  numberOfFood for multiplayer
  waiting lobby at the end of multiplayer game
  peaceful: teleport
  face on snake
  add multiplayer options (blocks, food adjustment)
  close room when empty
  show what options you chose (singleplayer and multiplayer)
  title screen
  make multiplayer lobby pretty
  collision sorta broken (disappear)
  alerts (not spam)
  'Hello, ___! your color is: ___'
  change size for mp
  XXX grid
  ***AI*** 
*/
$("#spBtn").click(() => {

  $("#spBtn").hide();
  $("#mpBtn").hide();
  $("#single-player").show();

  start(true)
})

$("#mpBtn").click(() => {
  $("#spBtn").hide();
  $("#mpBtn").hide();
  $("#multi-player").show();
  start(false)
})


const slider = document.getElementById("numFood")


//menu options
let rainbowOn = false;
let blocksOn = false;
let peaceOn = false;
let numberOfFood = 1;
slider.oninput = function() {
  numberOfFood = parseInt(this.value)
  $("#sliderNum").html(this.value)
}

let blocks = [];

$("#rainbowBtn").click(() => {rainbowOn = !rainbowOn;})
$("#blocksBtn").click(() => {blocksOn = !blocksOn;})
$("#peaceBtn").click(() => {peaceOn = !peaceOn;}) //doesn't work yet


function start (spOn){

  const socket = io.connect('https://snake2.frankezike.repl.co/');
  let roomID;
  let name;
  let game;
  let gameStarted = (spOn) ? true : false;

  const cvs = document.getElementById((spOn) ? "spCanvas" : "mpCanvas");

  // Unit
  const box = 32

  const sizeY = box*25; 
  const sizeX = 1.2*sizeY;

  cvs.width = sizeX;
  cvs.height = sizeY;
  cvs.style.border = "thick solid #0000FF";

  //define the canvas
  const ctx = cvs.getContext('2d');

  // Load Images
  const foodImg = new Image();
  foodImg.src = '/assets/food.png';

  let groundImg = new Image();
  groundImg.src = '/assets/ground.png';

  // Load audio
  let dead = new Audio();
  let eat = new Audio();
  let up = new Audio();
  let right = new Audio();
  let left = new Audio();
  let down = new Audio();

  dead.src = "audio/dead.mp3";
  eat.src = "audio/eat.mp3";
  up.src = "audio/up.mp3";
  right.src = "audio/right.mp3";
  left.src = "audio/left.mp3";
  down.src = "audio/down.mp3";

  //Create the snake
  let names = [];
  let playerIndex = 0;
  let snakes = [];

  const snakeColors = ["green", "red", "blue", "orange"]
  let snake = [];
  snake[0] = { x: 9*box, y: 10*box};

  snakes.push(snake)

  function randomLocation(size){ return Math.floor(Math.random()*size/box) * box}

  //create the food
  function createFood(){
    let result = {
      x: randomLocation(sizeX),
      y: randomLocation(sizeY)
    }
    for(let i=0; i<snakes.length; i++){
      for(let j=0; j<snakes[i]; j++){
        if(snakes[i][j].x == result.x && snakes[i][j].y == result.y){
          result = createFood();
        }
      }
    }

    return result;
  }

  $("#blocksBtn").click(() => {
    blocks.push(createFood())
  });

  let foods = []
  for (let i = 0; i< numberOfFood; i++){
    foods.push(createFood())
  }

  //create the score var
  let score = 0;

  //Control the snake
  let d = {
    chng: "",
    cur: ""
  };
  document.addEventListener('keydown', direction);
  function direction(event) {
    if (gameStarted){
      if(event.keyCode == 37 || event.keyCode == 65 && d != 'RIGHT') {
        d.chng = 'LEFT';
        //left.play();
      } else if(event.keyCode == 38 || event.keyCode == 87 && d != 'DOWN'){
        d.chng = 'UP';
        //up.play();
      } else if(event.keyCode == 39 || event.keyCode == 68 && d != 'LEFT') {
        d.chng = 'RIGHT';
        //right.play()
      } else if(event.keyCode == 40 || event.keyCode == 83 && d != 'UP') {
        d.chng = 'DOWN';
        //down.play();
      } else if (event.keyCode == 80){
        // p
        alert("Game Paused")
      }
    }
  }

  //Game Over: collision
  function collision(newHead, snake){
      for(let i=0; i<snake.length; i++){
        if(newHead.x == snake[i].x && newHead.y == snake[i].y && peaceOn == false){
          return true;
        }
      }
      return false;
    }

    //game over 
  function gameOver(){
    //dead.play();
    if (spOn == false){
      const msg = `${name}'s dumbass died!!`;
      socket.emit("gameEnded", {
        message: msg,
        playerIndex, 
        room: roomID
      });
      snakes[playerIndex] = []
      snake = []
      console.log(msg)
    } else {
      clearInterval(game)
    }
  }

  //grid
  function drawGrid(w, h) {

    for (var x = 0; x <= w; x += box) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }

    for (var y = 0; y <= h; y += box) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }

    ctx.strokeStyle = "#ddd";
    ctx.stroke();

  }

  iterator = 140;
  //draw everything to the canvas
  function draw(){

    //clear all
    ctx.fillStyle = 'rgb(243, 242, 242)'; //background color
    ctx.fillRect(0, 0, sizeX, sizeY);

    drawGrid(sizeX, sizeY);

    if(foods.length < numberOfFood){
      for (let i = foods.length; i< numberOfFood; i++){
        foods.push(createFood())
      }
    } else if (foods.length > numberOfFood){
      for (let i = numberOfFood; i< foods.length; i++){
        foods.pop(createFood())
      }
    }
    
    let rainbow;
      if (iterator > 70){
        iterator--;
        rainbow = '#'+(120000*iterator).toString(16);//120000 is color
      } else {
        iterator = 140
      }

    //  snakes drawn
    for(let i=0; i<snakes.length; i++){
      for(let j=0; j<snakes[i].length; j++){
        ctx.fillStyle = (j === 0) ? snakeColors[i] : (rainbowOn) ? rainbow : 'rgb(175, 238, 238)'; //snake head and body color
        ctx.fillRect(snakes[i][j].x, snakes[i][j].y, box, box);
        ctx.strokeStyle = 'black'; //snake border color
        ctx.strokeRect(snakes[i][j].x, snakes[i][j].y, box, box);
      }
    }

    //blocks drawn
    for(let i=0; i<blocks.length; i++){
      ctx.fillStyle = "brown";
      ctx.fillRect(blocks[i].x, blocks[i].y, box, box);
      ctx.strokeStyle = 'black'; //snblockorder color
      ctx.strokeRect(blocks[i].x, blocks[i].y, box, box);
    }

  
    //food drawn 
    for (food of foods){
      ctx.drawImage(foodImg, food.x, food.y);
    }
    

    //score label 
    ctx.fillStyle = 'red'; //score color
    ctx.font = '45px Arial';
    ctx.fillText(score, 2*box, 1.6*box);

    if (snake){
      snakeX = snake[0].x;
      snakeY = snake[0].y;


      if( d.chng == "LEFT"){

        if (d.cur !== "RIGHT"){
          snakeX -= box;
          d.cur = "LEFT";
        } else {
          d.cur = "RIGHT";
          snakeX += box;
        }

      }
      else if( d.chng == "UP"){

        if (d.cur !== "DOWN"){
          snakeY -= box;
          d.cur = "UP";
        } else {
          d.cur = "DOWN";
          snakeY += box;
        }
      } 
      else if(d.chng == "RIGHT"){
        
        if (d.cur !== "LEFT"){
          snakeX += box;
          d.cur = "RIGHT";
        } else {
          d.cur = "LEFT";
          snakeX -= box;
        }
      }
      else if( d.chng == "DOWN"){
        if(d.cur !== "UP"){
          snakeY += box;
          d.cur = "DOWN";
        } else {
          d.cur = "UP";
          snakeY -= box;
        }
      }
      
      
      //When snake eats food
      let eatenSomething = false
      for (let i=0; i<foods.length; i++){

        if (snakeX == foods[i].x && snakeY == foods[i].y){
          score++
          foods[i] = createFood();
          if (score % 2 == 0 && blocksOn == true){
            blocks.push(createFood());
          }
          eatenSomething = true;
          socket.emit("foodEaten", {foods, room:  roomID})
        }
        if (eatenSomething == false && i == foods.length-1){
          snake.pop();
        }
      }
      

        let newHead = {
        x: snakeX,
        y: snakeY
      }

    if(!spOn || !peaceOn){
      // game over : hits barrier

    if(snakeX < 0 || snakeX > sizeX - box || snakeY < 0 || snakeY > sizeY - box || collision(newHead,snake) || collision(newHead,blocks)){
        console.log("Hit wall")
        gameOver()
      }

      for(let i=0; i<snakes.length; i++){
        if(playerIndex !== i){
          if(collision(newHead, snakes[i])){
            gameOver()
          }
        }
      }
    }
      
      snake.unshift(newHead);

      socket.emit("movementMade", { name, playerIndex, snake, room: roomID})
    }
  } //draw ends

  if (spOn){
    game = setInterval(draw, 100)
  }


  //========================Socket Stuff======================================
  // Create a new game. Emit newGame event.
    $('#new').on('click', () => {
      name = $('#nameNew').val();
      if (!name) {
        alert('Please enter your name.');
        return;
      }
      socket.emit('createGame', { name });
  });


    // Join an existing game on the entered roomId. Emit the joinGame event.
    $('#join').on('click', () => {
      name = $('#nameJoin').val();
      roomID = $('#room').val();
      if (!name || !roomID) {
        alert('Please enter your name and game ID.');
        return;
      }
      socket.emit('joinGame', { name, room: roomID });
    });

  $('#startBtn').on('click', () => {

      for (let i=1; i<names.length; i++){ 
        snakes.push([createFood()])
      }

      foods = []
      for (let i =0; i< numberOfFood; i++){
        foods.push(createFood())
      }

      socket.emit('startGame', { 
        snakes, 
        foods, 
        room: roomID,
        rainbowOn,
        blocksOn,
        blocks,
        numberOfFood
       });
    })

    //get new game signal and start showing stuff
    socket.on('newGame', (data) => {
      const message =
        `Hello, ${data.name}. Please ask your friend to enter Game ID: 
        ${data.room}. Waiting for other players...`;

        //Create game for player 1
        $('.menu').css('display', 'none');
        $('#mpBoard').show()
        $('#startBtn').show()
        $('#userHello').html(message);
    });


    socket.on('joinEveryoneElse', (data) => {
      if (playerIndex !== 0){
        const message = `Hello, ${name}! Waiting for host to start the game...`;
        $('#userHello').html(message);
      }
      
      names = data.joinees;
      roomID = data.room
      $('#players').html(data.joinees.toString());
    });
    

    socket.on('joinSender', (data) => {
      const message = `Hello, ${name}! Waiting for host to start the game...`;
      roomID = data.room

      playerIndex = data.playerIndex;

      names = data.joinees;
      // Create game for everyone
        $('.menu').css('display', 'none');
        $('#mpBoard').show()
        $('#userHello').html(message);
        $('#players').html(data.joinees.toString());
        $('#startBtn').hide()
    });


    socket.on('gameHasStarted', (data) => {
      
      const message = `${name}, the game has begun!`;
      $('#userHello').html(message);
      $('#startBtn').hide();

      snakes = data.snakes;
      snake = data.snakes[playerIndex];
      foods = data.foods;
      numberOfFood = data.numberOfFood;
      peaceOn = data.peaceOn;
      blocks = data.blocks;
      blocksOn = data.blocksOn;
      rainbowOn = data.rainbowOn;

      gameStarted = true;

      let game = setInterval(draw, 100)
    })

    /**
     * Opponent played his turn. Update UI.
     * Allow the current player to play now. 
     */
    socket.on('movementReceived', (data) => {
      snakes[data.playerIndex] = data.playerSnake
      //console.log("Snakes 1", snakes)
    });

    socket.on("newFood", (data) => {
      foods = data.foods;
    })

    // If the other player wins, this event is received. Notify user game has ended.
    socket.on('gameEnd', (data) => {
      console.log(data.message);
      snakes[data.playerIndex] = [];
      snake = [];

      let losers = 0
      for (snake of snakes){
        if (snake.length == 0){
          losers++;
        }
      }
      if (losers == snakes.length-1){
        console.log("Game Over")
      }
      $('#startBtn').show()
      //causes an error: socket.leave(data.room);
    });

    /**
     * End the game on any err event. 
     */
    socket.on('err', (data) => {
      alert(data.message);
      location.reload();
    });

  //========================Socket Stuff======================================
} //start function ends