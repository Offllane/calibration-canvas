import {useState} from 'react';
import {Buffer} from 'buffer'

export function useCanvasPoints() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const getImageFromServer = async (): Promise<string> => {
    try {
      const response = await fetch('http://localhost:4000/getImage');
      const arrayBuffer: ArrayBuffer = await response.arrayBuffer();
      return `data:image/jpeg;base64, ${Buffer.from(arrayBuffer).toString('base64')}`
    } catch (error) {
      console.error(error);
      throw new Error('Error fetching image');
    }
  }

  const setImageToCanvas = async (): Promise<void> => {
    try {
      const image = await getImageFromServer();
      setImageSrc(image);
    } catch (error) {
      console.log('in error')
      console.error(error);
    }
  }

  return {
    imageSrc,
    setImageToCanvas
  };
}