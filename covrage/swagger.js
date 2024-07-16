import express from "express";
import axios from "axios";
import multer from "multer";
import csv from 'csv-parser';
import fs from 'fs';
import cors from 'cors';
import run, { storeddata, readData } from "./Mongodb.js";

const app = express();
const upload = multer({ dest: 'uploads/' });
const swaggerJSONUrl = "https://uat-cams.wakandi.com/api/swagger/v1/swagger.json";
let swaggerAPIs = [];

app.use(express.json());
app.use(cors());

async function fetchSwaggerJSON(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching Swagger JSON:", error);
        throw error;
    }
}

function extractPathsAndMethods(swaggerData) {
    const paths = Object.keys(swaggerData.paths);
    const extractedPathsAndMethods = [];
    for (const path of paths) {
        const methods = Object.keys(swaggerData.paths[path]);
        methods.forEach(method => {
            extractedPathsAndMethods.push({
                path: `/api${path}`,
                method: method.toUpperCase()
            });
        });
    }
    return extractedPathsAndMethods;
}

app.get("/", async (req, res) => {
    console.log(req.url);
    try {
        const swaggerData = await fetchSwaggerJSON(swaggerJSONUrl);
        const extractedPathsAndMethods = extractPathsAndMethods(swaggerData);
        console.log("extracted--------------->", extractedPathsAndMethods);
        
        swaggerAPIs = [];
        extractedPathsAndMethods.forEach((item) => {
            swaggerAPIs.push(item);
        });

        console.log("List of Extracted Paths and Methods:", swaggerAPIs);

        res.status(200).send({
            msg: "Hello",
            data: swaggerAPIs
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

app.post("/store", (req, res) => {

    try {
        console.log(typeof(req.body))
        if(Array.isArray(req.body)){
            console.log("running");
        run(req.body);
        res.sendStatus(200);
        }
    } catch (error) {
        console.log("data failed to store", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

app.post("/verify", async (req, res) => {
    try {
        const data = await readData();
        res.send(storeddata);
        console.log("Retrieved data----->", storeddata);
    } catch (error) {
        console.error("Error retrieving data:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

app.post("/upload", upload.single('file'), (req, res) => {
    console.log(req.url);
    console.log(">>>>>>>>>>>>>", req.file, "<<<<<<<<<<<<<<<<");
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = req.file.path;
        const endpoints = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                endpoints.push(row[Object.keys(row)[0]]);
            })
            .on('end', () => {
                console.log(endpoints);
                fs.unlinkSync(filePath); // Remove file after processing
                res.json({ endpoints });
            })
            .on('error', (error) => {
                fs.unlinkSync(filePath); // Remove file on error
                res.status(500).json({ error: "Error parsing CSV file: " + error.message });
            });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 8087;
app.listen(PORT, () => {
    console.log("Server is running on port", PORT);
});
