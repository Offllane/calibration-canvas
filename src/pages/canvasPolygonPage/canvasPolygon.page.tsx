import {useImage} from "../../shared/hooks/image.hook";
import {CytoscapeCanvas} from "../../features/canvas/cytoscapeCanvas";

export function CanvasPolygonPage() {
  const {imageSrc, setImageToCanvas} = useImage('http://localhost:4000/getImage')

  return (
      <div className='canvas-points-page canvas-page'>
          <CytoscapeCanvas
              imageSrc={imageSrc}
              maxDots={6}
              isNeedPolygon={true}
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