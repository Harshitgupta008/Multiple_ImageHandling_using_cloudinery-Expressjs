import express from "express";
import multer from "multer";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from "dotenv";
const app = express();
dotenv.config();

const port = process.env.PORT || 5000;

app.use(express.json());



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {

        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage })


cloudinary.config({
    cloud_name: process.env.cloudinary_cloud_name,
    api_key: process.env.cloudinary_api_key,
    api_secret: process.env.cloudinary_api_secret
});


app.post('/uploadfile', upload.array('image', 12), async function (req, res) {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    try {
        const uploadPromises = req.files.map(async (file) => {
            try {
                const uploadResult = await cloudinary.uploader.upload(file.path);
                fs.unlinkSync(file.path);
                return {
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id
                };
            } catch (error) {
                console.error('Error uploading to Cloudinary:', error);
                fs.unlinkSync(file.path);
                throw error;
            }
        });

        const fileUrls = await Promise.all(uploadPromises);
        console.log('Uploaded file URLs:', fileUrls);

        return res.json(fileUrls);
    } catch (error) {
        console.error('Error in file upload process:', error);
        return res.status(500).send('An error occurred while uploading files.');
    }
});
app.delete('/deletefile/:public_id', async function (req, res) {
    const { public_id } = req.params;

    try {
        const uploadResult = await cloudinary.uploader.destroy(public_id);
        return res.json(uploadResult);
    } catch (error) {
        console.error('Error deleting file:', error);
        return res.status(500).send('An error occurred while deleting the file.');
    }
});

app.listen(port, () => {
    console.log("done listen Part port no " + port)
})