import { useContext, useEffect, useRef } from 'react'
import rough from "roughjs"
import classes from "./Board.module.css"
import boardContext from '../store/board-context';
import { TOOL_ACTION_TYPES,TOOL_ITEMS } from '../../constants';
import toolboxContext from '../store/toolbox-context';
function Board() {
  const canvasRef = useRef();
  const { activeToolItem,elements, toolActionType, boardMouseDownHandler, boardMouseMoveHandler, boardMouseUpHandler,textAreaBurHandler,undo,redo } = useContext(boardContext);
  const {toolboxState} =useContext(toolboxContext);
  const textAreaRef=useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);
  useEffect(()=>{
    function handleKeydown(event){
      if(event.ctrlKey && event.key==='z'){
        undo();
      }
      else if(event.ctrlKey && event.key==='y'){
        redo();
      }
    }
    document.addEventListener("keydown",handleKeydown);
    return ()=>{
      document.removeEventListener("keydown",handleKeydown);
    };
  },[undo,redo]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.save();

    const roughCanvas = rough.canvas(canvas);
    elements.forEach((element) => {
      switch (element.type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          roughCanvas.draw(element.roughEle);
          break;
        case TOOL_ITEMS.BRUSH:
          context.fillStyle = element.stroke;
          context.fill(element.path);
          context.restore();
          break;
        case TOOL_ITEMS.TEXT:
          context.textBaseline = "top";
          context.font = `${element.size}px Caveat`;
          context.fillStyle = element.stroke;
          context.fillText(element.text || "", element.x1, element.y1);
          context.restore();
          break;
        default:
          throw new Error("Type not recognized");
      }
    });
    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [elements]);
  const handlemousedown = ((event) => {
    boardMouseDownHandler(event,toolboxState);
  });
  const handlemousemove = ((event) => {
    if (toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      boardMouseMoveHandler(event);
    }
  });
  const handlemouseup = ((event) => {
    boardMouseUpHandler(event);
  });
  return (
    <>
      {toolActionType === TOOL_ACTION_TYPES.WRITING && (
        <textarea
          type="text"
          ref={textAreaRef}
          className={classes.textElementBox}
          placeholder='Type here'
          style={{
            top: elements[elements.length - 1].y1,
            left: elements[elements.length - 1].x1,
            fontSize: `${elements[elements.length - 1]?.size}px`,
            color: elements[elements.length - 1]?.stroke,
          }}
          onBlur={(event) => textAreaBurHandler(event.target.value)}
        />
      )}
      <div>
        <canvas id="canvas" ref={canvasRef} onMouseDown={handlemousedown} onMouseMove={handlemousemove} onMouseUp={handlemouseup}/>
      </div>
    </>
  )
}

export default Board;