import { Logic } from "../ai/logic";
import { TIGER, GOAT, EAT, PUT, MOVE } from "../constants";
import { Howl } from "howler";
import tigerImage from "../images/tiger.png";
import goatImage from "../images/goat.png";
import diamondCircle from "../images/diamond-circle.png";
import topBorderImage from "../images/top-bar.png";
import bottomBorderImage from "../images/bottom-bar.png";
import leftRightBorderImage from "../images/left-right-bar.png";
import { mount, el, list } from "../ui/dom";
export class Board {
  constructor(realCanvasElement, fakeCanvasElement, infoBox, dataContainer) {
    this.chosenItem = null;
    this.myTurn = false;
    this.friend = 'computer';
    this.difficultyLevel = 5;
    this.dataContainer = dataContainer;
    this.realCanvasElement = realCanvasElement;
    this.fakeCanvasElement = fakeCanvasElement;
    this.infoBox = infoBox;
    this.playSound = true;
    this.sound = new Howl({
      src: ["bagchal.mp3"],
      html5: true,
      preload: true,
      autoplay: false,
      loop: false,
      volume: 1,
      sprite: {
        goat: [0, 2500],
        tiger: [3000, 3002],
        eating: [4000, 5500]
      }
    });

    // addRequiredDom ELEMENTS
    this.addUIDOMToGame();

    this.goats = []; // Array<{x:number,y:number,dead:false, currentPoint,drag: false,index: number;}>
    this.tigers = []; // Array<{x:number,y:number,currentPoint: number,drag: false,index: number}>

    const totalWidth = this.realCanvasElement.parentNode.offsetWidth;
    const totalHeight = window.innerHeight;
    this.totalWidth = totalWidth > 500 ? 500 : totalWidth;
    this.totalHeight =
      totalHeight > totalWidth
        ? totalWidth
        : totalHeight > 500
        ? 500
        : totalHeight;
    this.totalPoints = 24;
    this.paddingLeft = this.totalWidth / 10;
    this.paddingRight = this.totalWidth / 10;
    this.paddingTop = this.totalWidth / 10;
    this.paddingBottom = this.totalWidth / 10;
    this.height = this.totalHeight - (this.paddingTop + this.paddingBottom);
    this.width = this.totalWidth - (this.paddingLeft + this.paddingRight);
    this.steps = 4;
    this.verticalStep = this.width / this.steps;
    this.horizontalStep = this.height / this.steps;
    this.firstGoatRender = 0;
    this.tigerImage = null;
    this.goatImage = null;
    this.diamondCircleImage = null;
    this.leftRightBorderImage = null;
    this.topBorderImage = null;
    this.bottomBorderImage = null;
    this.verticalIndicators = [1, 2, 3, 4, 5];
    this.horizontalIndicators = ["A", "B", "C", "D", "E"];
    this.realCanvasElement.setAttribute("height", this.totalHeight);
    this.realCanvasElement.setAttribute("width", this.totalWidth);
    this.fakeCanvasElement.setAttribute("height", this.totalHeight);
    this.fakeCanvasElement.setAttribute("width", this.totalWidth);
    this.fakeCanvasElement.classList.add("hide");
    this.realCanvasElement.style.border = "1px solid #ccc";
    this.canvas = this.realCanvasElement.getContext("2d");
    this.fakeCanvas = this.fakeCanvasElement.getContext("2d");

    this.goatHeight = this.totalWidth >= 500 ? 80 : 60;
    this.goatWidth = this.totalWidth >= 500 ? 80 : 60;
    this.tigerWidth = this.totalWidth >= 500 ? 80 : 60;
    this.tigerHeight = this.totalWidth >= 500 ? 80 : 60;
    this.cirlceImageRad = this.totalWidth >= 500 ? 40 : 24;
    this.points = this.calculatePoints(); // Array<{x:number,y:number,index: number,item:'tiger or goat', itemIndex: number (tiger goat Index)}>;
    this.fillTigerPoints();
    this.mouseDown = false;
    this.mouseIntraction();
    this.totalMoveAttempts = 0;
    // item ready for drag
    this.dragItem = null; //  {item:TIGER,itemData:clickedPoint}
    this.animationInProgress = false;

    // AILevel = 3;
    this.logic = new Logic(this, this.difficultyLevel);
  }
  /**
   * handle mouse intraction
   */
  mouseIntraction() {
    this.canvasPosition = this.getCanvasPosition();
    /**
     * Mouse down/ touch start event handlers
     */
    this.realCanvasElement.addEventListener(
      "mousedown",
      this.handelMouseDownEvent.bind(this)
    );
    this.realCanvasElement.addEventListener(
      "touchstart",
      this.handelMouseDownEvent.bind(this)
    );

    /**
     * Mouse up /touch end event handlers
     */
    this.realCanvasElement.addEventListener(
      "mouseup",
      this.handleMouseUpEvent.bind(this)
    );
    this.realCanvasElement.addEventListener(
      "touchend",
      this.handleMouseUpEvent.bind(this)
    );
    this.fakeCanvasElement.addEventListener(
      "mouseup",
      this.handleMouseUpEvent.bind(this)
    );
    this.fakeCanvasElement.addEventListener(
      "touchend",
      this.handleMouseUpEvent.bind(this)
    );
    /**
     * mouse move/ touch move event handler
     */
    this.fakeCanvasElement.addEventListener(
      "mousemove",
      this.handleMouseMoveEvent.bind(this)
    );
    this.fakeCanvasElement.addEventListener(
      "touchmove",
      this.handleMouseMoveEvent.bind(this)
    );
    this.realCanvasElement.addEventListener(
      "touchmove",
      this.handleMouseMoveEvent.bind(this)
    );
  }
  /**
   * method to handle mouse down event/touch start
   * @param {mouse event} event
   */
  handelMouseDownEvent(event) {
    event.preventDefault();
    if (!this.chosenItem) {
      return true;
    }
    if (this.animationInProgress) {
      return true;
    }
    this.mouseDown = true;
    const pageX =
      event.type === "mousedown" ? event.pageX : event.changedTouches[0].pageX;
    const pageY =
      event.type === "mousedown" ? event.pageY : event.changedTouches[0].pageY;
    const x = pageX - this.canvasPosition.left;
    const y = pageY - this.canvasPosition.top;
    const goatWidth = Math.floor(this.goatWidth / 2);
    const goatHeight = Math.floor(this.goatHeight / 2);
    const clickedPoint = this.points.find(point => {
      return (
        x >= point.x - goatWidth &&
        x <= point.x + goatWidth &&
        y >= point.y - goatHeight &&
        y <= point.y + goatHeight
      );
    });
    if (!clickedPoint) {
      return true;
    }
    const i = clickedPoint.index;
    if (
      !clickedPoint.item &&
      this.chosenItem === GOAT &&
      this.goats.length < 20
    ) {
      const clickedGoatData = {
        x: clickedPoint.x,
        y: clickedPoint.y,
        dead: false,
        drag: false,
        currentPoint: i,
        index: this.goats.length
      };
      this.goats.push(clickedGoatData); // add new point to goat
      // track goat point to all points array
      this.points[i].item = GOAT;
      this.points[i].itemIndex = this.goats.length - 1;
      if(this.friend==='computer'){
        this.renderComputerTigerMove();
      }else{
        this.sendGoatMoveDataToFriend({
          type: 'new',
          nextPoint:null,
          goatPoint:clickedGoatData
        });
      }
    } else if (this.chosenItem === GOAT && this.goats.length === 20) {
      this.goats.forEach(g => (g.drag = g.currentPoint === i ? true : false));
      this.dragItem = { item: GOAT, point: clickedPoint };
    } else if (this.chosenItem === TIGER) {
      this.tigers.forEach(t => (t.drag = t.currentPoint === i ? true : false));
      this.dragItem = { item: TIGER, point: clickedPoint };
    }
    if (!this.dragItem) {
      return true;
    }
    this.showFakeCanvas();
    this.render();
  }
  /**
   * handle mouse down event
   * @param {mouse event} event
   */
  handleMouseUpEvent(event) {
    this.mouseDown = false;
    this.hideFakeCanvas();
    if (this.dragItem) {
      const pageX =
        event.type === "mouseup" ? event.pageX : event.changedTouches[0].pageX;
      const pageY =
        event.type === "mouseup" ? event.pageY : event.changedTouches[0].pageY;
      const x = pageX - this.canvasPosition.left;
      const y = pageY - this.canvasPosition.top;
      const goatWidth = Math.floor(this.goatWidth / 2);
      const goatHeight = Math.floor(this.goatHeight / 2);
      const releasedPoint = this.points.find(point => {
        return (
          x >= point.x - goatWidth &&
          x <= point.x + goatWidth &&
          y >= point.y - goatHeight &&
          y <= point.y + goatHeight
        );
      });
      if (releasedPoint) {
        if (this.dragItem.item === GOAT) {
          const possiblePoints = this.getNextPossibleMove(
            this.dragItem.point.index,
            GOAT
          );
          const validPoint = possiblePoints.find(
            p => p === releasedPoint.index
          );
          if (validPoint) {
            const draggedGoat = this.goats.find(g => g.drag);
            if (draggedGoat) {
              const prevPointIndex = draggedGoat.currentPoint;
              const currentPointIndex = releasedPoint.index;

              // release  item from prev point
              this.points[prevPointIndex].item = null;
              this.points[prevPointIndex].itemIndex = null;
              // update goat points
              this.goats[draggedGoat.index].x = x;
              this.goats[draggedGoat.index].y = y;
              this.goats[draggedGoat.index].currentPoint = currentPointIndex;

              // add new item to points
              this.points[currentPointIndex].item = GOAT;
              this.points[currentPointIndex].itemIndex = draggedGoat.index;
              // computer turn to move tiger
              if(this.friend==='computer'){
                this.renderComputerTigerMove();
              }else{
                // send current data to friend
                this.sendGoatMoveDataToFriend({
                  type: 'move',
                  nextPoint:currentPointIndex,
                  goatPoint:draggedGoat
                });
              }
            }
          }
        } else {
          const possiblePoints = this.getNextPossibleMove(
            this.dragItem.point.index,
            TIGER
          );
          const validPoint = possiblePoints.find(
            p => p.point === releasedPoint.index
          );

          if (validPoint) {
            const draggedTiger = this.tigers.find(t => t.drag);
            if (draggedTiger) {
              // release  item from prev point
              const prevPointIndex = draggedTiger.currentPoint;
              this.points[prevPointIndex].item = null;
              this.points[prevPointIndex].itemIndex = null;
              // update tiger point
              this.tigers[draggedTiger.index].x = x;
              this.tigers[draggedTiger.index].y = y;
              this.tigers[draggedTiger.index].currentPoint = releasedPoint.index;
              // add this tiger reference to points array
              const nextPointIndex =releasedPoint.index;
              this.points[nextPointIndex].item = TIGER;
              this.points[nextPointIndex].itemIndex = draggedTiger.index;
              // if tiger eat the goat remove goat from goats
              if (validPoint.eatGoat) {
                // remove eaten goat point index from points
                const currentEatenGoatIndex = this.goats[
                  validPoint.eatGoatIndex
                ].currentPoint;
                this.points[currentEatenGoatIndex].item = null;
                this.points[currentEatenGoatIndex].itemIndex = null;
                this.goats[validPoint.eatGoatIndex] = {
                  x: 0,
                  y: 0,
                  dead: true,
                  currentPoint: -currentEatenGoatIndex
                };
               if(this.playSound){
                this.sound.play("tiger");
               }
              }
             if(this.playSound){
              this.sound.play("goat");
             }
              // computer turns to move goat
              if(this.friend==='computer'){
                this.renderComputerGoatMove();
              }else{
                this.sendTigerMoveDataToFriend({
                    tigerIndex: draggedTiger.index,
                    tigerNextPointIndex: nextPointIndex,
                    eatGoat: validPoint.eatGoat,
                    eatGoatIndex: validPoint.eatGoatIndex
                  });
              }
            }
          }
        }
      }
    }
    this.dragItem = null;
    this.goats.forEach(g => (g.drag = false));
    this.tigers.forEach(t => (t.drag = false));
    this.render();
  }

  handleMouseMoveEvent(event) {
    event.preventDefault();
    if (this.animationInProgress) {
      return true;
    }
    if (!(this.mouseDown && this.dragItem)) {
      return true;
    }
    const pageX =
      event.type === "mousemove" ? event.pageX : event.changedTouches[0].pageX;
    const pageY =
      event.type === "mousemove" ? event.pageY : event.changedTouches[0].pageY;
    const x = pageX - this.canvasPosition.left;
    const y = pageY - this.canvasPosition.top;
    this.fakeCanvas.clearRect(0, 0, this.width * 1.5, this.height * 1.5);
    if (this.dragItem.item === GOAT) {
      this.drawBoardGoat({ x, y }, this.fakeCanvas);
    } else {
      this.drawTigerImage({ x, y }, this.fakeCanvas);
    }
  }
  /**
   * render all objects
   */
  render() {
    this.tigerMoveAttems = 0;
    this.canvas.clearRect(0, 0, this.totalWidth * 1.5, this.totalHeight * 1.5);
    this.drawBoard();
    this.drawTigers();
    this.renderGoats();
    this.firstGoatRender++;
  }
  /**
   * calculate all posible points of board
   */
  calculatePoints() {
    let points = [];
    for (
      let y = this.paddingTop;
      y <= this.totalHeight;
      y += this.horizontalStep
    ) {
      for (
        let x = this.paddingLeft;
        x <= this.totalWidth;
        x += this.verticalStep
      ) {
        points.push({
          x: x,
          y: y,
          index: points.length,
          item: null,
          itemIndex: null
        });
        if (this.diamondCircleImage) {
          this.canvas.drawImage(
            this.diamondCircleImage,
            x - this.cirlceImageRad / 2,
            y - this.cirlceImageRad / 2,
            this.cirlceImageRad,
            this.cirlceImageRad
          );
        } else {
          this.diamondCircleImage = new Image();
          this.diamondCircleImage.onload = () => {
            this.canvas.drawImage(
              this.diamondCircleImage,
              x - this.cirlceImageRad / 2,
              y - this.cirlceImageRad / 2,
              this.cirlceImageRad,
              this.cirlceImageRad
            );
          };
          this.diamondCircleImage.src = diamondCircle;
        }
      }
    }
    return points;
  }
  /**
   * add points to tiger array while initialising the game
   */
  fillTigerPoints() {
    [0, 4, 20, 24].forEach((t, i) => {
      this.points[t].item = TIGER;
      this.points[t].itemIndex = t;
      const point = this.points[t];
      this.tigers.push({
        x: point.x,
        y: point.y,
        currentPoint: t,
        drag: false,
        index: i
      });
    });
  }

  /**
   * draw square and lines for board
   */
  drawBoard() {
    let sides = ["vertical", "horizontal"];
    //draw inner rectangle
    let yMiddlePoint = this.paddingTop + this.height / 2;

    sides.forEach(element => {
      let i = 0;
      let stepSize =
        element == "vertical" ? this.verticalStep : this.horizontalStep;
      let totalSize = element == "vertical" ? this.width : this.height;
      for (let length = 0; length <= totalSize; length += stepSize) {
        let x1 =
          element == "vertical" ? this.paddingLeft + length : this.paddingLeft;
        let y1 =
          element == "vertical" ? this.paddingTop : this.paddingTop + length;
        let x2 =
          element == "vertical"
            ? this.paddingLeft + length
            : this.paddingLeft + this.width;
        let y2 =
          element == "vertical"
            ? this.paddingTop + this.height
            : this.paddingTop + length;
        // this.drawText(
        //   x1,
        //   y1,
        //   element,
        //   element === "vertical"
        //     ? this.horizontalIndicators[i]
        //     : this.verticalIndicators[i]
        // );
        this.drawLine(x1, y1, x2, y2);
        i++;
      }

      //draw diagonal lines
      let dx1 =
        element == "vertical"
          ? this.paddingLeft
          : this.paddingLeft + this.width;
      let dy1 = this.paddingTop;

      let dx2 =
        element == "vertical"
          ? this.paddingLeft + this.width
          : this.paddingLeft;
      let dy2 = this.paddingTop + this.height;
      this.drawLine(dx1, dy1, dx2, dy2);

      let mPointx1 = this.paddingLeft + this.width / 2;
      let mPointy1 =
        element == "vertical" ? this.paddingTop : this.paddingTop + this.height;
      let mPointx2 =
        element == "vertical"
          ? this.paddingLeft
          : this.paddingLeft + this.width;
      let mPointy2 = this.paddingTop + this.height / 2;
      this.drawLine(mPointx1, mPointy1, mPointx2, mPointy2);
      this.drawLine(
        mPointx1,
        mPointy1,
        mPointx2 + (element == "vertical" ? this.width : -this.width),
        mPointy2
      );
    });

    // draw small circles near each point
    this.points.forEach((p, i) => {
      const factor = i % 2 === 0 ? 1 : 2;
      this.canvas.drawImage(
        this.diamondCircleImage,
        p.x - this.cirlceImageRad / (2 * factor),
        p.y - this.cirlceImageRad / (2 * factor),
        this.cirlceImageRad / factor,
        this.cirlceImageRad / factor
      );
    });

    // draw left right top down border images
    if (this.topBorderImage) {
      this.canvas.drawImage(
        this.topBorderImage,
        0,
        0,
        this.totalWidth,
        this.paddingTop
      );
      this.canvas.drawImage(
        this.borderBottomImage,
        0,
        this.totalHeight - this.paddingBottom,
        this.totalWidth,
        this.paddingBottom
      );
      this.canvas.drawImage(
        this.leftRightBorderImage,
        0,
        this.paddingTop,
        this.paddingLeft,
        this.height
      );
      this.canvas.drawImage(
        this.leftRightBorderImage,
        this.totalWidth - this.paddingRight,
        this.paddingTop,
        this.paddingRight,
        this.height
      );
    } else {
      this.topBorderImage = new Image();
      this.topBorderImage.onload = () => {
        this.canvas.drawImage(
          this.topBorderImage,
          0,
          0,
          this.totalWidth,
          this.paddingTop
        );
      };
      this.topBorderImage.src = topBorderImage;

      this.borderBottomImage = new Image();
      this.borderBottomImage.onload = () => {
        this.canvas.drawImage(
          this.borderBottomImage,
          0,
          this.totalHeight - this.paddingBottom,
          this.totalWidth,
          this.paddingBottom
        );
      };
      this.borderBottomImage.src = bottomBorderImage;

      this.leftRightBorderImage = new Image();
      this.leftRightBorderImage.onload = () => {
        this.canvas.drawImage(
          this.leftRightBorderImage,
          0,
          this.paddingTop,
          this.paddingLeft,
          this.height
        );
        this.canvas.drawImage(
          this.leftRightBorderImage,
          this.totalWidth - this.paddingRight,
          this.paddingTop,
          this.paddingRight,
          this.height
        );
      };
      this.leftRightBorderImage.src = leftRightBorderImage;
    }
  }

  /**
   * draw tigers on board
   */
  drawTigers() {
    this.tigers.forEach(element => {
      if (element.drag) {
        return;
      }
      this.drawTigerImage(element, this.canvas);
    });
  }

  drawTigerImage(point, canvas) {
    if (this.tigerImage) {
      canvas.drawImage(
        this.tigerImage,
        point.x - this.tigerWidth / 2,
        point.y - this.tigerHeight / 2,
        this.tigerWidth,
        this.tigerHeight
      );
      return true;
    }
    this.tigerImage = new Image();
    this.tigerImage.onload = () => {
      canvas.drawImage(
        this.tigerImage,
        point.x - this.tigerWidth / 2,
        point.y - this.tigerHeight / 2,
        this.tigerWidth,
        this.tigerHeight
      );
      this.drawTigers();
    };
    this.tigerImage.src = tigerImage;
  }
  /**
   * draw goats on standby rectangle or on board
   */
  renderGoats() {
    this.goats.forEach(point => {
      if (point.dead || point.drag) {
        return;
      }
      this.drawBoardGoat(point, this.canvas);
    });
  }

  /**
   * method to draw goat
   * @param {*} x1
   * @param {*} y1
   * @param {*} canvas fake/real canvas object
   */
  drawBoardGoat(point, canvas) {
    canvas.beginPath();
    canvas.globalCompositeOperation = "source-over";
    if (this.goatImage) {
      canvas.drawImage(
        this.goatImage,
        point.x - this.goatWidth / 2,
        point.y - this.goatHeight / 2,
        this.goatWidth,
        this.goatHeight
      );
    } else {
      this.goatImage = new Image();
      this.goatImage.onload = () => {
        canvas.drawImage(
          this.goatImage,
          point.x - this.goatWidth / 2,
          point.y - this.goatHeight / 2,
          this.goatWidth,
          this.goatHeight
        );
      };
      this.goatImage.src = goatImage;
    }
    canvas.closePath();
  }

  /**
   * method to draw line on canvas
   * @param {} x1
   * @param {*} y1
   * @param {*} x2
   * @param {*} y2
   */
  drawLine(x1, y1, x2, y2) {
    this.canvas.beginPath();
    this.canvas.moveTo(x1, y1);
    this.canvas.lineTo(x2, y2);
    this.canvas.strokeStyle = "#636363";
    this.canvas.lineWidth = 1;
    this.canvas.lineCap = "round";
    this.canvas.stroke();
    this.canvas.closePath();
  }

  /**
   * method to get canvas positio on current window
   */
  getCanvasPosition() {
    let box = this.realCanvasElement.getBoundingClientRect();
    let scrollLeft = this.realCanvasElement.parentNode.scrollLeft;
    let scrollTop = this.realCanvasElement.parentNode.scrollTop;
    let body = document.body;
    let docEl = document.documentElement;

    scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    let clientTop = docEl.clientTop || body.clientTop || 0;
    let clientLeft = docEl.clientLeft || body.clientLeft || 0;
    let top = box.top + scrollTop - clientTop;
    let left = box.left + scrollLeft - clientLeft;
    return { top: Math.round(top), left: Math.round(left) };
  }

  /**
   * show fake canvas for the animation purpose
   */
  showFakeCanvas() {
    this.fakeCanvas.clearRect(0, 0, this.totalHeight, this.totalWidth);
    this.fakeCanvasElement.classList.remove("hide");
  }
  /**
   * hide fake canvas once animation is over
   */
  hideFakeCanvas() {
    this.fakeCanvas.clearRect(0, 0, this.totalHeight, this.totalWidth);
    this.fakeCanvasElement.classList.add("hide");
  }

  /**
   * move the tiger after user moves the goat
   */
  renderComputerTigerMove() {
    let avilableTigers = [];
    this.tigers.forEach((tigerPoint, i) => {
      let pointIndex;
      for (let j in this.points) {
        const point = this.points[j];
        if (
          parseInt(point.x) == parseInt(tigerPoint.x) &&
          parseInt(point.y) == parseInt(tigerPoint.y)
        ) {
          pointIndex = j;
          break;
        }
      }
      let nextMovePossibleMoves = this.getNextPossibleMove(pointIndex);
      if (nextMovePossibleMoves.length > 0) {
        avilableTigers.push({
          tiger: i,
          point: pointIndex,
          possibleMoves: nextMovePossibleMoves
        });
      }
    });
    if (avilableTigers.length > 0) {
      let tigerData = null;
      // getting next best move for tiger, will be improved later
      const bestMove = this.logic.getNextBestMove(TIGER, avilableTigers);
     
      if (bestMove.eatGoat) {
        // eats the goat
       if(this.playSound){
        this.sound.play("tiger");
       }       
      } 
      this.moveTiger(bestMove);
    } else {
      window.game.modalService();
    }

    const deadGoats = this.goats.filter(g => g.dead).length;
    const goatsInBoard = this.goats.filter(g => !g.dead).length;
    this.deadGoatIndicator.innerHTML = `Dead Goats: ${deadGoats}`;
    this.goatBoardIndicator.innerHTML = `Goats in Board : ${goatsInBoard}`;
  }

  /**
   * render goat after user moves tiger
   */
  renderComputerGoatMove() {
    const nextBestMove = this.logic.getNextBestMove(GOAT);
    if(nextBestMove) {
      // only used "new" and "move" because it was used in this file
      let goatType = "new";
      let nextPoint = null;
      // in case of put, goatPoint is just a board point
      let goatPoint = nextBestMove.move; 
      if(nextBestMove.type == MOVE) {
        goatType = "move";
        nextPoint =  nextBestMove.destinationPoint;
        // in case of move, goatPoint is a goat value from this.goats
        goatPoint =  this.goats.filter(g => !g.dead).find(goat => goat.currentPoint == nextBestMove.sourcePoint);
      }
      this.moveGoat(nextPoint, goatPoint, goatType);
    }
    this.render();
    const deadGoats = this.goats.filter(g => g.dead).length;
    const goatsInBoard = this.goats.filter(g => !g.dead).length;
    this.deadGoatIndicator.innerHTML = `Dead Goats: ${deadGoats}`;
    this.goatBoardIndicator.innerHTML = `Goats in Board : ${goatsInBoard}`;
  }
  /**
   * get next possible moves of tiger/goat
   * @param {} pointIndex
   */
  getNextPossibleMove(pointIndex, type = TIGER) {
    pointIndex = Number(pointIndex);
    this.totalMoveAttempts++;

    const nextPossiblePoints = [5, -5]; // 5, -5 for move up down
    if (pointIndex % 2 === 0) {
      //can move diagonally
      if (pointIndex % 5 === 0) {
        // left conrner points
        nextPossiblePoints.push(-4, 6);
      } else if (pointIndex % 5 === 4) {
        // right corners
        nextPossiblePoints.push(4, -6);
      } else {
        nextPossiblePoints.push(4, -4, 6, -6);
      }
    }

    if (pointIndex % 5 === 0) {
      // left conrner points
      nextPossiblePoints.push(1);
    } else if (pointIndex % 5 === 4) {
      // right corner points
      nextPossiblePoints.push(-1);
    } else {
      nextPossiblePoints.push(1, -1);
    }
    let nextLegalPoints = [];
    nextPossiblePoints.forEach(el => {
      const index = Number(el) + Number(pointIndex);
      if (index >= 0 && index < this.totalPoints) {
        nextLegalPoints.push(index);
      }
    });
    if (type === GOAT) {
      return nextLegalPoints.filter(p => !this.points[p].item);
    }
    nextLegalPoints = nextLegalPoints.map(p => {
      const point = this.points[p];
      if (point.item === GOAT) {
        const tigerMoveDistance = p - pointIndex;
        const tigerEatPoint = Number(p) + Number(tigerMoveDistance);
        // get the distance between current position and next position
        // and double the distance is where tiger will jump to eat goat
        if (
          tigerEatPoint < 0 ||
          tigerEatPoint > this.totalPoints ||
          ([1, 4, 6].indexOf(Math.abs(tigerMoveDistance)) >= 0 &&
            (p % 5 === 4 || p % 5 === 0))
        ) {
          // if next eat point is less than zero or greater thant totalPoint
          // or the goat is at right most point or goat is at left most point
          return null;
        }

        const eatPoint = this.points[tigerEatPoint];
        if (eatPoint && !eatPoint.item) {
          return {
            point: tigerEatPoint,
            eatGoat: true,
            eatGoatIndex: point.itemIndex
          };
        }
        return null;
      } else if (!point.item) {
        return { point: p, eatGoat: false };
      }
      return null;
    });
    return nextLegalPoints.filter(p => p);
  }

  displayPossibleMoves(tigerIndex, possibleMoves) {
    // const moves = possibleMoves.map(el => {
    //   return (
    //     this.verticalIndicators[Math.floor(el / 5)].toString() +
    //     this.horizontalIndicators[el % 5].toString()
    //   );
    // });
    // mount(this.moveIndicator, el("h3", `Tiger ${tigerIndex + 1}`));
    // const tigerPossiblePointList = list(
    //   `ul.tiger-possible-points`,
    //   TigerPossibleMoveList
    // );
    // mount(this.moveIndicator, tigerPossiblePointList);
    // tigerPossiblePointList.update(moves);
  }

  drawText(x, y, side, text) {
    this.canvas.beginPath();
    this.canvas.font = "20px Arial";
    this.canvas.fillStyle = "#000";
    this.canvas.fillText(
      text,
      side === "vertical" ? x : x - 15,
      side === "vertical" ? y - 10 : y
    );
    this.canvas.closePath();
  }
  /**
   *
   * @param {tiger/goat} item
   * @param {{prevPoint:this.tigers[tigerToMove.tiger],nextPoint:tigerNewPoint,currentPoint:tigerMovePoint.point}} data
   */
  showMoveAnimation(item, data) {
    const frameRate = 24;
    this.animationInProgress = true;
    if (item === TIGER) {
      const prevPoint = data.prevPoint;
      const nextPoint = data.nextPoint;
      let frame = 0;
      let x = prevPoint.x;
      let y = prevPoint.y;
      const dx = nextPoint.x - prevPoint.x;
      const dy = nextPoint.y - prevPoint.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const xIncrement = dx / frameRate;
      const yIncrement = dy / frameRate;
      this.tigers[prevPoint.index] = {
        x: -2000,
        y: -2000,
        currentPoint: data.currentPoint
      };
      const animationFrame = setInterval(() => {
        if (frame < 10) {
          this.showFakeCanvas();
        }
        this.fakeCanvas.clearRect(0, 0, this.width * 1.2, this.height * 1.2);
        this.drawTigerImage({ x: x, y: y }, this.fakeCanvas);
        if (absDx < 1) {
          y += yIncrement;
        } else if (absDy < 1) {
          x += xIncrement;
        } else {
          x += xIncrement;
          y = (dy / dx) * (x - prevPoint.x) + prevPoint.y;
        }
        if (frame > frameRate) {
          this.animationInProgress = false;
          this.tigers[prevPoint.index] = {
            x: nextPoint.x,
            y: nextPoint.y,
            drag: false,
            index: prevPoint.index,
            currentPoint: nextPoint.index
          };
          this.render();
          this.hideFakeCanvas();
          clearInterval(animationFrame);
        }
        frame++;
      }, 20);
    } else {
      // {type:'new',pointData:{x:point.x,y:point.y,dead: false,drag: false,index:this.goats.length,currentPoint:point.index}
      const pointData = data.pointData;
      const midPoint = this.totalWidth / 2;
      let x = data.type === "new" ? midPoint : this.goats[pointData.index].x ;
      let y = data.type === "new" ? 0 : this.goats[pointData.index].y ;
      const dx = pointData.x - x;
      const dy = pointData.y-y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const xIncrement = dx / frameRate;
      const yIncrement = dy / frameRate;
      let frame = 0;
      if(data.type==='move'){
        this.goats[pointData.index].x = -200;
        this.goats[pointData.index].y = -200;
        this.render();
      }
      const animationFrame = setInterval(() => {
        if (frame < 10) {
          this.showFakeCanvas();
        }
        this.fakeCanvas.clearRect(0, 0, this.width * 1.2, this.height * 1.2);
        this.drawBoardGoat({ x: x, y: y }, this.fakeCanvas);
        if (absDx < 1) {
          y += yIncrement;
        } else if (absDy < 1) {
          x += xIncrement;
        } else {
          x += xIncrement;
          y = (dy / dx) * (x - midPoint);
        }
        if (frame > frameRate) {
          this.animationInProgress = false;
          if (data.type === "new") {
            this.goats.push(pointData);
          } else {
            this.goats[pointData.index].x = pointData.x;
            this.goats[pointData.index].y = pointData.y;
            this.goats[pointData.index].currentPoint = pointData.currentPoint;
          }
          this.render();
          this.hideFakeCanvas();
          clearInterval(animationFrame);
        }
        frame++;
      }, 20);
    }
  }

  /**
   * method to move goat from both computer or friends move
   */
  moveGoat(nextPoint, goatPoint, type) {
    if (type === "move") {
      // here goatPoint is an element of this.goats[index]
      const point = this.points.find(point => point.index == nextPoint);
      // release goat from prev point
      this.points[goatPoint.currentPoint].item = null;
      this.points[goatPoint.currentPoint].itemIndex = null;
      // map new goat position to points
      point.item = GOAT;
      point.itemIndex = goatPoint.index;
      // show animation and change goat point

      this.showMoveAnimation(GOAT, {
        type: "move",
        pointData: {x:point.x,y:point.y,currentPoint:point.index,index:goatPoint.index}
      });
    } else {
      // here goatPoint is an element of the this.points[i]
      this.points[goatPoint.index].item = GOAT;
      this.points[goatPoint.index].itemIndex = this.goats.length;
      this.showMoveAnimation(GOAT, {
        type: "new",
        pointData: {
          x: goatPoint.x,
          y: goatPoint.y,
          dead: false,
          drag: false,
          index: this.goats.length,
          currentPoint: goatPoint.index
        }
      });
    }
  }

  /**
   * method to move tiger for both computer or friends move
   * @param tigerData { tigerIndex: index from tigers array, tigerNextPointIndex: tigerNextPointIndex,   eatGoat: boolean,  eatGoatIndex: number };
   */
  moveTiger(tigerData) {
    if(tigerData.eatGoat){
      const currentEatenGoatIndex = this.goats[
        tigerData.eatGoatIndex
      ].currentPoint;
      this.points[currentEatenGoatIndex].item = null;
      this.points[currentEatenGoatIndex].itemIndex = null;
      this.goats[tigerData.eatGoatIndex] = {
        x: 0,
        y: 0,
        dead: true,
        currentPoint: -currentEatenGoatIndex
      };
    }

    const tigerNewPoint = this.points[tigerData.nextPointIndex];
    // release prev tiger index from all points
    const currentTigerPointIndex = this.tigers[tigerData.tigerIndex]
      .currentPoint;
    this.points[currentTigerPointIndex].item = null;
    this.points[currentTigerPointIndex].itemIndex = null;

    const animationTigerData = {
      prevPoint: this.tigers[tigerData.tigerIndex],
      nextPoint: tigerNewPoint,
      currentPointIndex: tigerData.tigerIndex
    };
    this.showMoveAnimation(TIGER, animationTigerData);

    // add new reference of tiger to the points
    this.points[tigerData.nextPointIndex].item = TIGER;
    this.points[tigerData.nextPointIndex].itemIndex = tigerData.tiger;
  }

  /**
   * method to send current users goat move/add data to friend
   * @param data {nextPoint, goatPoint, type}
   *
   */
  sendGoatMoveDataToFriend(data){

  }


  /**
   * send current user's tiger move data to friend
   * @param data {prevPointIndex,nextPointIndex,tiger: draggedTiger}
   */
  sendTigerMoveDataToFriend(data){

  }

  addUIDOMToGame(){
    mount(
      this.infoBox,
      (this.selectItem = el(
        "div.select-option",
        el(
          "div.container-fluid",
          el('div.game-name',''),
          this.playWithInterface = el('div.play-with-interface',
          el("p", "Play with?"),
          el("div.play-options",
            el( "button.play-with-computer", ""),
            el( "button.play-with-friend", ""),
          )
          ),
          this.difficultyLevelInterface = el('div.difficulty-level-interface.hide',
          el("p", "Level"),
          el("div.difficulty-levels",
            el( "button.easy", "Easy"),
            el( "button.medium", "Medium"),
            el( "button.hard", "Hard"),
          )
          ),
          this.selectItemInterface = el('div.select-interface.hide',
              el("p", "Play as?"),
              el(
                "div.pick-options",
                el(
                  "button",
                  {
                    class: "select-turn-btn tiger"
                  },
                  ""
                ),
                el("button", { class: "select-turn-btn goat" }, "")
              ),
              el('div.sound-setting.text-right',
              this.playSoundButton = el('button.play-sound',''),
           )
            ),
         
        )
      ))
    );
    mount(
      this.infoBox,
      (this.genralInfo = el(
        "div.container-fluid.goat-box",
        el(
          "div.row",
          el(
            "div.col-xs-4",
            (this.goatBoardIndicator = el("p", `Goats in board : 0`))
          ),
          el(
            "div.col-xs-4.text-center",
            (this.displayChosenItem = el("p", "You Choose"))
          ),
          el(
            "div.col-xs-4.text-right",
            (this.deadGoatIndicator = el("p", `Dead Goats: 0`))
          )
        )
      ))
    );

    // mute unmute sound button
    this.playSoundButton.addEventListener('click', ()=>{
      if(this.playSoundButton.classList.contains('play-sound')){
        this.playSoundButton.classList.remove('play-sound');
        this.playSoundButton.classList.add('mute-sound');
       this.playSound  = false;
      }else{
        this.playSoundButton.classList.add('play-sound');
        this.playSoundButton.classList.remove('mute-sound');
        this.playSound  = true;
      }
    })

    this.selectItem.querySelectorAll(".select-turn-btn").forEach(element => {
      element.addEventListener("click", event => {
        if (event.target.classList.contains(TIGER)) {
          this.chosenItem = TIGER;
          if(this.playSound){
            this.sound.play("tiger");
          }
          this.renderComputerGoatMove();
        } else {
          this.chosenItem = GOAT;
          if(this.playSound){
            this.sound.play("goat");
          }
        }
        this.myTurn = this.chosenItem === "GOAT" ? true : false;
        this.displayChosenItem.innerHTML = `You chose : ${this.chosenItem.toUpperCase()}`;
        this.selectItem.classList.add("hide");
      });
    });

    this.playWithInterface.querySelectorAll("button").forEach(element => {
      element.addEventListener("click", event => {
        if (event.target.classList.contains('play-with-friend')) {
          this.friend = 'friend';
         
        this.selectItemInterface.classList.remove('hide');   
        } else {
          this.difficultyLevelInterface.classList.remove('hide');
         this.friend = 'computer';        
        } 
        this.playWithInterface.classList.add('hide');  
      });
    });
    
    this.difficultyLevelInterface.querySelectorAll('button').forEach(element =>{
      element.addEventListener("click", event => {
        if (event.target.classList.contains('easy')) {
         this.difficultyLevel = 1;
        } else if(event.target.classList.contains('medium')) {
          this.difficultyLevel = 2;

        }else{
          this.difficultyLevel = 3;
        } 
        this.logic = new Logic(this, this.difficultyLevel);
        this.difficultyLevelInterface.classList.add('hide');  
        this.selectItemInterface.classList.remove('hide');    
      });
    });
  }
}
