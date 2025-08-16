import boardContext from "./board-context"
import { TOOL_ITEMS, BOARD_ACTIONS, TOOL_ACTION_TYPES } from "../../constants"
import { useCallback, useReducer } from "react"
import rough from "roughjs"
import { createRoughElement } from "../../utils/element";
import getStroke from "perfect-freehand";
import { getSvgPathFromStroke,isPointNearElement } from "../../utils/element";

const gen = rough.generator();

const boardReducer = (state, action) => {
    switch (action.type) {
        case BOARD_ACTIONS.CHANGE_TOOL:
            return {
                ...state,
                activeToolItem: action.payload.tool,
            }
        case BOARD_ACTIONS.CHANGE_ACTION_TYPE:
            return{
                ...state,
                toolActionType:action.payload.actiontype,
            }
        case BOARD_ACTIONS.DRAW_DOWN: {
            const { clientX, clientY,stroke, fill, size } = action.payload;
            const newElement = createRoughElement(state.elements.length, clientX, clientY, clientX, clientY, 
                { type: state.activeToolItem, stroke, fill, size });
            return {
                ...state,
                toolActionType: state.activeToolItem===TOOL_ITEMS.TEXT?TOOL_ACTION_TYPES.WRITING:TOOL_ACTION_TYPES.DRAWING,
                elements: [...state.elements, newElement],
            };
        };
        case BOARD_ACTIONS.DRAW_MOVE: {
            const { clientX, clientY } = action.payload;
            const newElements = [...state.elements];
            const index = state.elements.length - 1;
            const { type } = newElements[index];
            switch (type) {
                case TOOL_ITEMS.LINE:
                case TOOL_ITEMS.RECTANGLE:
                case TOOL_ITEMS.CIRCLE:
                case TOOL_ITEMS.ARROW:{
                    const { x1, y1, stroke, fill, size } = newElements[index];
                    const newElement = createRoughElement(index, x1, y1, clientX, clientY, {
                        type: state.activeToolItem,
                        stroke,
                        fill,
                        size,
                    });
                    newElements[index] = newElement;
                    return {
                        ...state,
                        elements: newElements,
                    };
                }
                case TOOL_ITEMS.BRUSH:{
                    
                    newElements[index].points = [
                        ...newElements[index].points,
                        { x: clientX, y: clientY },
                    ];
                    newElements[index].path = new Path2D(
                        getSvgPathFromStroke(getStroke(newElements[index].points))
                    );
                    return {
                        ...state,
                        elements: newElements,
                    };
                }
                default:
                throw new Error("Type not recognized");
            }
        };
        case BOARD_ACTIONS.CHANGE_TEXT:{
            const newElements = [...state.elements];
            const index = state.elements.length - 1;
            newElements[index].text=action.payload.text;
            const newhistory=state.history.slice(0,state.index+1);
            newhistory.push(newElements);
            return{
                ...state,
                toolActionType:TOOL_ACTION_TYPES.NONE,
                elements:newElements,
                history: newhistory,
                index:state.index+1,
            };
        }
        case BOARD_ACTIONS.ERASE: {
            const { clientX, clientY } = action.payload;
            const newhistory=state.history.slice(0,state.index+1);
            
            const newelements = state.elements.filter(
                (element) => {
                    return !isPointNearElement(element, clientX, clientY);

                }
            );
            newhistory.push(newelements);
            return {
                ...state,
                elements: newelements,
                history:newhistory,
                index:state.index+1,
            };
        }
        case BOARD_ACTIONS.DRAW_UP:{
            const elementscopy=[...state.elements];
            const newhistory=state.history.slice(0,state.index+1);
            newhistory.push(elementscopy);
            return{
                ...state,
                history:newhistory,
                index: state.index+1
            }
        }
        case BOARD_ACTIONS.UNDO:{
            if(state.index<=0) return state;
            return{
                ...state,
                elements:state.history[state.index-1],
                index:state.index-1,
            }
        }
        case BOARD_ACTIONS.REDO:{
            if(state.index>=state.history.length-1) return state;
            return{
                ...state,
                elements:state.history[state.index+1],
                index:state.index+1,
            }
        }
        default:
            return state;
    }
};

const initialBoardstate = {
    activeToolItem: TOOL_ITEMS.BRUSH,
    toolActionType: TOOL_ACTION_TYPES.NONE,
    elements: [],
    history:[[]],
    index:0,
};
function BoardProvider({ children }) {
    const [boardState, dispatchBoardAction] = useReducer(boardReducer, initialBoardstate);
    const changeToolHandler = (tool) => {
        dispatchBoardAction({ type: BOARD_ACTIONS.CHANGE_TOOL, payload: { tool } });
    };
    const boardMouseDownHandler = ((event,toolboxState) => {
        const { clientX, clientY } = event;
        if(boardState.toolActionType===TOOL_ACTION_TYPES.WRITING) return;
        if(boardState.activeToolItem===TOOL_ITEMS.ERASER){
            dispatchBoardAction({
                type:BOARD_ACTIONS.CHANGE_ACTION_TYPE,
                payload:{
                    actiontype:TOOL_ACTION_TYPES.ERASING,
                }
            });
            dispatchBoardAction({
                type:BOARD_ACTIONS.ERASE,
                payload:{
                    clientX,
                    clientY
                }
            });
            
            return;
        }
        dispatchBoardAction({
            type: BOARD_ACTIONS.DRAW_DOWN,
            payload: {
                clientX,
                clientY,
                stroke: toolboxState[boardState.activeToolItem]?.stroke,
                fill: toolboxState[boardState.activeToolItem]?.fill,
                size: toolboxState[boardState.activeToolItem]?.size,
            }
        });
    });

    const boardMouseMoveHandler = ((event) => {
        if(boardState.toolActionType===TOOL_ACTION_TYPES.WRITING) return;
        const { clientX, clientY } = event;
        if(boardState.toolActionType===TOOL_ACTION_TYPES.ERASING){
            dispatchBoardAction({
                type:BOARD_ACTIONS.ERASE,
                payload:{
                    clientX,
                    clientY
                },
            });
        }
        else if(boardState.toolActionType===TOOL_ACTION_TYPES.DRAWING){
            dispatchBoardAction({
            type: BOARD_ACTIONS.DRAW_MOVE,
            payload: {
                clientX,
                clientY,
            }
        });
        }
        
    });

    const boardMouseUpHandler = () => {
        if(boardState.toolActionType===TOOL_ACTION_TYPES.WRITING) return;
        if(boardState.toolActionType===TOOL_ACTION_TYPES.DRAWING) {
            dispatchBoardAction({
                type:BOARD_ACTIONS.DRAW_UP,
            })
        }
        dispatchBoardAction({
            type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
            payload:{
                actiontype:TOOL_ACTION_TYPES.NONE,
            }
        });
    };
    const textAreaBurHandler=(text)=>{
        dispatchBoardAction({
            type:BOARD_ACTIONS.CHANGE_TEXT,
            payload:{
                text,
            }
        })
    };
    const boardUndoHandler=useCallback(()=>{
        dispatchBoardAction({
            type:BOARD_ACTIONS.UNDO,
        })
    });
    const boardRedoHandler=useCallback(()=>{
        dispatchBoardAction({
            type:BOARD_ACTIONS.REDO,
        })
    });
    const boardContextValue = {
        activeToolItem: boardState.activeToolItem,
        toolActionType: boardState.toolActionType,
        elements: boardState.elements,
        changeToolHandler,
        boardMouseDownHandler,
        boardMouseMoveHandler,
        boardMouseUpHandler,
        textAreaBurHandler,
        undo:boardUndoHandler,
        redo:boardRedoHandler,
    };

    return (
        <boardContext.Provider value={boardContextValue}>{children}</boardContext.Provider>
    );
};

export default BoardProvider;