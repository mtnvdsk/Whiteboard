import Board from "./Components/Board/Board";
import BoardProvider from "./Components/store/BoardProvider";
import ToolboxProvider from "./Components/store/ToolboxProvider";
import Toolbar from "./Components/Toolbar/Toolbar";
import Toolbox from "./Components/Toolbox/Toolbox";

function App() {
  return (
    <BoardProvider>
      <ToolboxProvider>
        <Toolbar/>
        <Board/>
        <Toolbox/>
      </ToolboxProvider>
    </BoardProvider>
  )
}

export default App;
