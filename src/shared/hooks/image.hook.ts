import {Buffer} from "buffer";
import {useState} from "react";

export const useImage = (url: string) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    const getImageFromServer = async (): Promise<string> => {
        try {
            const response = await fetch(url);
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
    }
}