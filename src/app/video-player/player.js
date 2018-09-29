'use strict';


document.onload = onDocumentLoad();


let cues = [];

let videoPlayer = document.querySelector('#videoPlayer');
let subtitleSpace = document.querySelector('#subtitle');

const signature = 'WEBVTT';
const TIMESTAMP_REGEXP = /([0-9]{1,2})?:?([0-9]{2}):([0-9]{2}\.[0-9]{3})/;

//Events
videoPlayer.ontimeupdate = function () {
    updateSubtitle();
}

function onDocumentLoad() {
    //When the document is first loaded download the subtitle
    downloadSubtitle();
}

function downloadSubtitle() {
    let request = new XMLHttpRequest();

    request.open('GET', 'http://127.0.0.1:8000/sub.vtt', true);
    request.onload = function () {

        let data = this.response;

        if (request.status >= 200 && request.status < 400) {
            parseFile(data);
        } else {
            console.log('error');
        }
    };

    request.send();
}

function parseFile(data) {
    //Firstly we remove the null character ''
    data = data.replace(/\0/g, '');
    //now we replace carriage return followed by new line by just a new line character
    data = data.replace(/\r\n/g, '\n');
    //Now we replace all remaining carriage return with a new line characrer
    data = data.replace(/\r/g, '\n');
    //We know each block is seperated by 2 consecutive new lines so splitting the string to seprate  blocks
    let webvttSplits = data.split('\n\n');

    createCues(webvttSplits);
}

function createCues(webvttSplits) {

    console.log("webvttSplits",webvttSplits);
    //get the first block as header
    let header = webvttSplits.shift();
    //Check if the first block contains its signature i.e WEBVTT
    if (header.length < 6) {
        //since the first line of code is shorter than length of signature we say this is not a valid webvtt file
        return;
    } else if (header.length == 6 && header != signature) {
        //since the signature does not match we say this is not a valid webvtt file
        return;
    } else if (header.length > 6 && (header[6] != '\n' || header[6] != ' ' || header[6] != '\t')) {
        // since length of the first line is more than 6 and does not follow any space or new line its not valid webvtt file
        return;
    } else {
        //for valid webvtt file we seperate each block of into syles, regions and cues
        // webvttSplits.forEach(split => {
        //     if (split.substring(0, 5) == 'STYLE') {
        //         //  TODO add it to style block
        //     }
        //     else if (split.substring(0, 6) == 'REGION') {
        //         //  TODO add it to Region block
        //     }
        //     else {
        //         cues.push(split);
        //     }
        // })

        cues = parseSplits(webvttSplits);
        console.log("After parsing splits, the cues are",cues);
    }
}

function parseSplits(splits){
    return splits.map(parseCue).filter(Boolean);
}

function parseCue(cue,index){
    let cueObject ={
        id:null,
        subtitle:'',
        startDuration:0,
        endDuration:0

    };
    const cueLines = cue.split('\n').filter(Boolean);

    if(cueLines.length>0 && cueLines[0].startsWith('NOTE')){
        return null;
    }

    if (cueLines.length === 1 && !cueLines[0].includes('-->')) {
        console.log('Parsing error cue header is alone on index ',index);
        return;
    }

    if (cueLines.length > 1 &&
        !(cueLines[0].includes('-->') || cueLines[1].includes('-->'))) {
        console.log('Cue header needs to be followed by timestamp on index ',index);
        return;
    }

    if(cueLines.length>0 && cueLines[0].startsWith('STYLE')){
    //    TODO do something with the style block
        return;
    }
    if(cueLines.length>0 && cueLines[0].startsWith('REGION')){
        //    TODO do something with the REGION block
        return;
    }

    if (cueLines.length > 1 && cueLines[1].includes('-->')) {
        cueObject.id = cueLines.shift();
    }

    if (cueLines.length > 0 && cueLines[0].includes('-->')) {
        const times = cueLines[0].split(' --> ');

        if (times.length !== 2 ||
            !validTimestamp(times[0]) ||
            !validTimestamp(times[1])) {
            console.log('Invalid timestamp on index ',index);
            return;
        }

        cueObject.startDuration = convertToSeconds(times[0]);
        cueObject.endDuration = convertToSeconds(times[1]);

        if (cueObject.startDuration > cueObject.endDuration) {
            console.log('Start time should be smaller than end on index ',index);
            return;
        }

        if (cueObject.endDuration <= cueObject.startDuration) {
            console.log('End time must be greater than start on index ',index);
            return;
        }

        cueLines.shift();

    }

    cueObject.subtitle = cueLines.join('\n');
    return cueObject;

}

function updateSubtitle() {
    let activeCues = getCueForTime(videoPlayer.currentTime);
    let subtitle = activeCues.reduce(getSubtitleFromCue,"");
    console.log("inside subtitle ",subtitle);
    subtitleSpace.innerHTML = subtitle;

}

function getSubtitleFromCue(text,cue){
    return text+cue.subtitle;
}

function convertToSeconds(time) {

    let timeSplits = time.split(':');

    let hr = Number(timeSplits[0]);
    let min = Number(timeSplits[1]);
    let sec = Number(timeSplits[2]);

    return (hr*60*60+min*60+sec);

}

function getCueForTime(currentTime) {
    // cues.forEach(cue=>{
    //     let cueSplits = cue.split('\n');
    //     let timeInterval = cueSplits[0];
    //     let time = timeInterval.split('-->' );
    //
    //     let lowerLimit = convertToSeconds(time[0]);
    //     let upperLimit = convertToSeconds(time[1]);
    //
    //     if(videoPlayer.currentTime>=lowerLimit && videoPlayer.currentTime<=upperLimit ){
    //
    //         let currentSubtitle = '';
    //         for(let i = 1;i<cueSplits.length;i++){
    //             currentSubtitle += cueSplits[i];
    //
    //         }
    //
    //     }
    // })

    return cues.filter(cue=> currentTime>=cue.startDuration && currentTime<cue.endDuration);

}

function validTimestamp (timestamp) {
    return TIMESTAMP_REGEXP.test(timestamp);
}

