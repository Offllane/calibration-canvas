import {CytoscapeCanvas} from '../../features/canvas/cytoscapeCanvas';
import {useImage} from '../../shared/hooks/image.hook';
import {useNodePosition} from '../../shared/hooks/nodesPosition.hook';


export function CanvasPointsPage() {
  const {imageSrc, setImageToCanvas} = useImage('http://localhost:4000/getImage');
  const { nodesPosition, setNodesPosition } = useNodePosition();

  return (
    <div className='canvas-points-page canvas-page'>
      <CytoscapeCanvas
        imageSrc={imageSrc}
        maxDotsQuantity={4}
        canvasTask='points'
        setNodesPosition={setNodesPosition}
      />
      <aside>
        <button onClick={setImageToCanvas} >
          Получить картинку
        </button>
        <div style={{whiteSpace: 'pre', width: '15vw'}}>
          {JSON.stringify(nodesPosition, null, 2)}
        </div>
      </aside>
    </div>
  );
}