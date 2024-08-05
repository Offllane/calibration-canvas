import {useImage} from "../../shared/hooks/image.hook";
import {useNodePosition} from "../../shared/hooks/nodesPosition.hook";
import {CytoscapeCanvas} from "../../features/canvas/cytoscapeCanvas";

export function LinesPolygonPage() {
  const {imageSrc, setImageToCanvas} = useImage('http://localhost:4000/getImage');
  const { nodesPosition, setNodesPosition } = useNodePosition();

  return (
    <div className='canvas-points-page canvas-page'>
      <CytoscapeCanvas
        imageSrc={imageSrc}
        maxDotsQuantity={6}
        canvasTask='lines'
        setNodesPosition={setNodesPosition}
        lineQuantity={2}
      />
      <aside>
        <button onClick={setImageToCanvas}>
          Получить картинку
        </button>
        <div style={{whiteSpace: 'pre', width: '15vw'}}>
          {JSON.stringify(nodesPosition, null, 2)}
        </div>
      </aside>
    </div>
  );
};