// const express = require('express');
// const ffmpeg = require('fluent-ffmpeg');
// const multer = require('multer'); // For handling file uploads
// const { pool } = require('./postgresql')
// const fetch = require('node-fetch').default;

import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import multer from 'multer'; // For handling file uploads
import { pool } from './postgresql.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fileSystem from 'fs/promises';
import fs from 'fs'
import path from 'path'
import cors from 'cors';
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

function requireHTTPS(req, res, next) {
    // The 'x-forwarded-proto' check is for Heroku
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}


ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const app = express();
const port = 3000;

app.use(requireHTTPS);
app.use(express.static('./dist/speak-spectrum'));

app.get('/*', (req, res) =>
    res.sendFile('index.html', {root: 'dist/speak-spectrum/'}),
);

app.post('/*', (req, res) =>
    res.sendFile('index.html', {root: 'dist/speak-spectrum/'}),
);

const storage = multer.memoryStorage(); // Store the video in memory
const upload = multer({ storage: storage });

// require('dotenv').config();
dotenv.config();
const ffmpegPath = process.env.FFMPEG_PATH

app.use(cors());
app.post('/uploadVideo', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No video uploaded');
    }
    console.log(req.file.buffer)
    const inputVideoBuffer = req.file.buffer;
    const audioOutput = 'output.wav'; // Storing audio in WAV format

    // Convert the input video buffer to a readable stream
    const inputVideoStream = new Readable();
    inputVideoStream.push(inputVideoBuffer);
    inputVideoStream.push(null); // Signals the end of the stream
    const format = 'mp4'
    ffmpeg(inputVideoBuffer)
        .input(inputVideoStream)
        .inputFormat(format)
        .audioCodec('pcm_s16le')
        .toFormat('wav')
        .output(audioOutput)
        .on('end', async () => {
            try {
                const audioBuffer = await fileSystem.readFile(audioOutput);
                
                // Save the video and audio to the database
                const values = [inputVideoBuffer, audioBuffer];
                const queryText = 'INSERT INTO videos(video, audio) VALUES($1, $2) RETURNING id';

                const dbResponse = await pool.query(queryText, values);

                if (dbResponse.rows && dbResponse.rows[0]) {
                    res.send({ videoId: dbResponse.rows[0].id });
                } else {
                    res.status(500).send('Error saving video and audio');
                }

                // Optionally delete the temporary audio file from the file system if not needed anymore
                await fileSystem.unlink(audioOutput);
            }catch (error) {
                console.error('Error processing and saving audio:', error);
                res.status(500).send('Server error');
            }
        })
        .save(audioOutput);
});
// import { spawn } from 'child_process';

// app.post('/uploadVideo', upload.single('video'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).send('No video uploaded');
//     }

//     const inputVideoBuffer = req.file.buffer;
//     const audioOutput = 'output.wav'; // Storing audio in WAV format

//     // Create a promise to handle the ffmpeg conversion
//     const convertToWav = () => {
//         return new Promise((resolve, reject) => {
//             const ffmpegProcess = spawn(ffmpegPath, [
//                 '-i', '-',         // Use stdin as the input file
//                 '-f', 'wav',       // Output format is WAV
//                 '-ac', '2',        // Set number of audio channels to 2 (stereo)
//                 'pipe:1'           // Output the audio to stdout
//             ]);

//             // Handle errors during the conversion process
//             ffmpegProcess.on('error', (error) => {
//                 reject(error);
//             });

//             // Capture the audio data from stdout
//             const audioChunks = [];
//             ffmpegProcess.stdout.on('data', (chunk) => {
//                 audioChunks.push(chunk);
//             });

//             // Handle the end of the conversion process
//             ffmpegProcess.on('close', (code) => {
//                 if (code === 0) {
//                     const audioBuffer = Buffer.concat(audioChunks);
//                     resolve(audioBuffer);
//                 } else {
//                     reject(new Error(`ffmpeg process exited with code ${code}`));
//                 }
//             });

//             // Write the input video buffer to the ffmpeg process's stdin
//             ffmpegProcess.stdin.write(inputVideoBuffer);
//             ffmpegProcess.stdin.end();
//         });
//     };

//     try {
//         const audioBuffer = await convertToWav();

//         // Save the video and audio to the database
//         const values = [inputVideoBuffer, audioBuffer];
//         const queryText = 'INSERT INTO videos(video, audio) VALUES($1, $2) RETURNING id';

//         const dbResponse = await pool.query(queryText, values);

//         if (dbResponse.rows && dbResponse.rows[0]) {
//             res.send({ videoId: dbResponse.rows[0].id });
//         } else {
//             res.status(500).send('Error saving video and audio');
//         }

//         // Optionally delete the temporary audio file from the file system if not needed anymore
//         // await fs.unlink(audioOutput);
//     } catch (error) {
//         console.error('Error processing and saving audio:', error);
//         res.status(500).send('Server error');
//     }
// });

import { promisify } from 'util';
const writeFileAsync = promisify(fs.writeFile);

function writeFilePromise(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function waitFileToBeWritten(filePath) {
  const timeout = 500; // Adjust the delay as needed
  while (!fs.existsSync(filePath)) {
    await new Promise((resolve) => setTimeout(resolve, timeout));
  }
}

app.get('/getTranscript/:videoId', async (req, res) => {
    const videoId = req.params.videoId;
    const queryText = 'SELECT audio FROM public.videos WHERE id=$1';
    const values = [videoId];

    const dbResponse = await pool.query(queryText, values);
    if (!dbResponse.rows || !dbResponse.rows[0]) {
        return res.status(404).send('No audio found for the given videoId');
    }
    console.log("1")
    const audioBuffer = dbResponse.rows[0].audio;
    console.log("2")
    // Save the audio buffer to a temporary file
    const tempFilePath = path.join(__dirname, `temp_${videoId}.wav`);
    console.log("3")
    console.log(tempFilePath)
    await fileSystem.writeFile(tempFilePath, audioBuffer);
    
    // try {
    //     await writeFilePromise(tempFilePath, audioBuffer);
    //     console.log('File has been written completely:', tempFilePath);
    //     // Wait for the file to be completely written
    //     // await waitFileToBeWritten(tempFilePath);
    //     console.log('File has been checked and is ready:', tempFilePath);
    //   } catch (err) {
    //     res.status(500).send('Error writing audio to a temporary file: ' + err);
    //     return;
    //   }

    // Your Azure Credentials
    const subscriptionKey = process.env.SUBSCRIPTION_KEY;
    const region = process.env.LOCATION;

    var format = SpeechSDK.AudioStreamFormat.getWaveFormatPCM(44100, 16, 2); //44.1 kHz, 16-bit, 2-channel
      // create the push stream we need for the speech sdk.
    var pushStream = SpeechSDK.AudioInputStream.createPushStream(format);
    
    fs.createReadStream(tempFilePath).on('data', function(arrayBuffer) {
        pushStream.write(arrayBuffer.slice());
      }).on('end', function() {
        pushStream.close();
      });
 
    // const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, region);
    console.log("4")

    console.log("5")
    const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream);
    console.log("6")
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, region);
    speechConfig.speechRecognitionLanguage = "en-US";
    // speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "30000")
    let recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    console.log("temp")
    recognizer.recognizing = function (s, e) {
        var str = "(recognizing) Reason: " + SpeechSDK.ResultReason[e.result.reason] + " Text: " + e.result.text;
        console.log(str);
    };
    recognizer.recognized = (reco, e) => {
        try {
            const res = e.result;
            console.log(`recognized: ${res.text}`);
        } catch (error) {
            console.log(error);
        }
      };
      // start the recognizer and wait for a result.
      recognizer.recognizeOnceAsync(
          function (result) {
            console.log(result)
            recognizer.close();
              recognizer = undefined;
            const updateQuery = 'UPDATE videos SET transcript=$1 WHERE id=$2';
            console.log(`RECOGNIZED: Text=${result.text}`);
            pool.query(updateQuery, [result.text, videoId]);
            fs.unlinkSync(tempFilePath);  
            res.send(result);
        },
        function (err) {
            console.error('Error recognizing speech:', err);
            recognizer.close();
            recognizer = undefined;
            res.status(500).send('Error recognizing speech: ' + err);
        }       
      );
});


app.get('/analyzeSentiment/:videoId', async (req, res) => {
    const videoId = req.params.videoId;
    const queryText = 'SELECT transcript FROM public.videos WHERE id=$1';
    const values = [videoId];

    const dbResponse = await pool.query(queryText, values);
    if (!dbResponse.rows || !dbResponse.rows[0]) {
        return res.status(404).send('No transcript found for the given videoId');
    }

    let transcript = dbResponse.rows[0].transcript;
    const textAnalyticsEndpoint = process.env.TEXT_ANALYTICS_ENDPOINT;
    const apiKey = process.env.TEXT_ANALYTICS_API_KEY;
    
    const response = await fetch(`${textAnalyticsEndpoint}/text/analytics/v3.0/sentiment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': apiKey
        },
        body: JSON.stringify({
            documents: [{
                language: "en",
                id: "1",
                text: transcript
            }]
        })
    });

    const data = await response.json();

    if (data && data.documents && data.documents[0]) {
        res.json(data.documents[0].sentiment);
    } else {
        res.status(500).send('Error analyzing sentiment');
    }
});

app.get('/analyzeTalkTime/:videoId', async (req, res) => {
    const videoId = req.params.videoId;
    const queryText = 'SELECT video FROM videos WHERE id=$1';
    const values = [videoId];

    const dbResponse = await pool.query(queryText, values);
    if (!dbResponse.rows || !dbResponse.rows[0]) {
        return res.status(404).send('No video found for the given videoId');
    }

    const videoBuffer = dbResponse.rows[0].video;

    // Azure Video Indexer Credentials
    // const videoIndexerEndpoint = "YOUR_AZURE_VIDEO_INDEXER_ENDPOINT";
    const apiKey = process.env.VIDEO_INDEXER_API_KEY ;
    const location = process.env.LOCATION;  
    const accountId = process.env.ACCOUNT_ID;
    const accessToken = process.env.VIDEO_INDEXER_API_KEY

    // // First, obtain an access token
    // const tokenResponse = await fetch(`https://api.videoindexer.ai/Auth/${location}/Accounts/${accountId}/${accessToken}?allowEdit=true`, {
    //     method: 'GET',
    //     headers: {
    //         'Ocp-Apim-Subscription-Key': process.env.PRIMARY_KEY
    //     }
    // });

    // const accessToken = await tokenResponse.text();

    // Next, upload the video for indexing
    const videoResponse = await fetch(`https://api.videoindexer.ai/${location}/Accounts/${accountId}/Videos?name=someName&accessToken=${accessToken}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        body: videoBuffer
    });

    // const videoData = await videoResponse.json();

    // Once indexing is done, get the insights
    const insightsResponse = await fetch(`https://api.videoindexer.ai/${location}/Accounts/${accountId}/Videos/${accessToken}/Index?accessToken=${accessToken}`);
    const insightsData = await insightsResponse.json();

    const talkTimeResults = {}; 

    // Ensure insightsData and insightsData.summarizedInsights are defined
    if (insightsData && insightsData.summarizedInsights) {
        const speakers = insightsData.summarizedInsights.faces || [];

        for (const speaker of speakers) {
            const speakerName = speaker.name;
            const talkTimeInSeconds = speaker.appearance.duration;
            talkTimeResults[speakerName] = talkTimeInSeconds;
        }
    } else {
        // Handle the case where insightsData or insightsData.summarizedInsights are undefined
        console.error('Unexpected insightsData structure:', insightsData);
        return res.status(500).send('Unexpected insightsData structure received from Video Indexer');
    }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
