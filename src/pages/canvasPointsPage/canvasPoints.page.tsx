import {CytoscapeCanvas} from '../../features/canvas/cytoscapeCanvas';
import {useImage} from '../../shared/hooks/image.hook';


export function CanvasPointsPage() {
  const {imageSrc, setImageToCanvas} = useImage('http://localhost:4000/getImage')

  return (
    <div className='canvas-points-page canvas-page'>
      <CytoscapeCanvas
        imageSrc={imageSrc}
        maxDotsQuantity={4}
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