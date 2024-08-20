import * as fs from 'fs';
import csvParser from 'csv-parser';

interface IIIFManifest {
    "@context": string;
    id: string;
    type: string;
    label: { [key: string]: string[] };
    items: IIIFCanvas[];
}

interface IIIFCanvas {
    id: string;
    type: string;
    label: { [key: string]: string[] };
    height: number;
    width: number;
    items: IIIFAnnotationPage[];
    annotations?: IIIFAnnotationPage[];
}

interface IIIFAnnotationPage {
    id: string;
    type: string;
    items: IIIFAnnotation[];
}

interface IIIFAnnotation {
    id: string;
    type: string;
    motivation: string;
    body: {
        id: string;
        type: string;
        format: string;
        height?: number;
        width?: number;
        value?: string;
    };
    target: string;
}

function readFilenamesFromCSV(filePath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const filenames: string[] = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                filenames.push(row.filename);
            })
            .on('end', () => {
                resolve(filenames);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

function generateManifest(filenames: string[]): IIIFManifest {
    const canvases: IIIFCanvas[] = filenames.map((filename, index) => ({
        id: `https://example.org/iiif/book1/canvas/p${index + 1}`,
        type: "Canvas",
        label: { "en": [`Page ${index + 1}`] },
        height: 1800,
        width: 1200,
        items: [
            {
                id: `https://example.org/iiif/book1/page/p${index + 1}/1`,
                type: "AnnotationPage",
                items: [
                    {
                        id: `https://example.org/iiif/book1/annotation/p${String(index + 1).padStart(4, '0')}-image`,
                        type: "Annotation",
                        motivation: "painting",
                        body: {
                            id: `https://example.org/iiif/book1/res/${filename}`,
                            type: "Image",
                            format: "image/png",
                            height: 1800,
                            width: 1200
                        },
                        target: `https://example.org/iiif/book1/canvas/p${index + 1}`
                    }
                ]
            }
        ],
        annotations: [
            {
                id: `https://example.org/iiif/book1/annotationpage/p${index + 1}/comments`,
                type: "AnnotationPage",
                items: [
                    {
                        id: `https://example.org/iiif/book1/annotation/p${String(index + 1).padStart(4, '0')}-comment`,
                        type: "Annotation",
                        motivation: "commenting",
                        body: {
                            id: `https://example.org/iiif/book1/comment/${index + 1}`,
                            type: "TextualBody",
                            format: "text/plain",
                            value: `This is a comment for page ${index + 1}`
                        },
                        target: `https://example.org/iiif/book1/canvas/p${index + 1}`
                    }
                ]
            }
        ]
    }));

    const manifest: IIIFManifest = {
        "@context": "http://iiif.io/api/presentation/3/context.json",
        id: "https://example.org/iiif/book1/manifest",
        type: "Manifest",
        label: { "en": ["Example Book 1"] },
        items: canvases
    };

    return manifest;
}

const csvFilePath = 'data.csv';

readFilenamesFromCSV(csvFilePath)
    .then((filenames) => {
        const manifest = generateManifest(filenames);
        console.log(JSON.stringify(manifest, null, 2));
    })
    .catch((error) => {
        console.error('Error reading CSV file:', error);
    });