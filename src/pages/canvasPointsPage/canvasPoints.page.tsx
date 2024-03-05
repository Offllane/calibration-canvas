import {CytoscapeCanvas} from '../../features/canvas/cytoscapeCanvas';
import {useCanvasPoints} from './canvasPoints.hook';


export function CanvasPointsPage() {
  const {
    imageSrc,
    setImageToCanvas
  } = useCanvasPoints();

  return (
    <div className='canvas-points-page canvas-page'>
      <CytoscapeCanvas
        imageSrc={imageSrc}
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