import {CytoscapeCanvas} from "../../features/canvas/cytoscapeCanvas";
import {useImage} from "../../shared/hooks/image.hook";
import {useNodePosition} from '../../shared/hooks/nodesPosition.hook';

export function CanvasSelectPage() {
  const {imageSrc, setImageToCanvas} = useImage('http://localhost:4000/getImage');
  const { nodesPosition, setNodesPosition } = useNodePosition();

  return (
    <div className='canvas-points-page canvas-page'>
      <CytoscapeCanvas
        imageSrc={imageSrc}
        maxDotsQuantity={4}
        canvasTask='selection'
        setNodesPosition={setNodesPosition}
      />
      <aside>
        <button
          onClick={setImageToCanvas}
        >
          Получить картинку
        </button>
      </aside>
    </div>
  );
}