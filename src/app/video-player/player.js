'use strict';
console.log('Fund the script');
document.onload = onDocumentLoad();
let cues = [];
let videoPlayer = document.querySelector('#videoPlayer');
let subtitleSpace = document.querySelector('#subtitle');
console.log(videoPlayer);

function onDocumentLoad() {

    //When the document is first loaded download the subtitle

    var request = new XMLHttpRequest();

    request.open('GET', 'http://127.0.0.1:8000/sintel.vtt', true);
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
    // data= data.replace( /r /g , '\n');
    console.log(data.split('\r\n'));
    //now we replace carriage return followed by new line by just a new line character
    data = data.replace(/\r\n/g, '\n');
    //Now we replace all remaining carriage return with a new line characrer
    data = data.replace(/\r/g, '\n');
    //We know each block is seperated by 2 consecutive new lines so splitting the string to seprate each block
    let webttSplits = data.split('\n\n');
    console.log('Cues are ', webttSplits);

    createCues(webttSplits);
}

function createCues(webttSplits) {
    if (webttSplits[0].length < 6) {
        return;
    } else if (webttSplits[0].length == 6 && webttSplits[0] != 'WEBVTT') {
        return;
    } else if (webttSplits[0].length > 6 && (webttSplits[0][6] != '\n' || webttSplits[0][6] != ' ' || webttSplits[0][6] != '\t')) {
        return;
    } else {
        webttSplits.forEach(split => {
            if (split.substring(0, 5) == 'STYLE') {
                //  TODO add it to style block
            }
            else if (split.substring(0, 6) == 'REGION') {
                //  TODO add it to Region block
            } else if (split.substring(0, 7) == 'WEBVTT') {
                //  We ignore the first line
            }
            else {
                cues.push(split);
            }
        })
    }
}

function updateSubtitle() {
    cues.forEach(cue=>{
        let cueSplits = cue.split('\n');
        let timeInterval = cueSplits[0];
        let time = timeInterval.split('-->' );
        // console.log(time[0],time[1]);

        let lowerLimit = convertToSeconds(time[0]);
        let upperLimit = convertToSeconds(time[1]);

        if(videoPlayer.currentTime>=lowerLimit && videoPlayer.currentTime<=upperLimit ){

            let currentUpperLimit = upperLimit;
            let currentSubtitle = '';
            for(let i = 1;i<cueSplits.length;i++){
                currentSubtitle += cueSplits[i];

            }
            subtitleSpace.innerHTML = currentSubtitle;
        }
    })
}

function convertToSeconds(time) {

    let timeSplits = time.split(':');
    let hr = Number(timeSplits[0]);
    let min = Number(timeSplits[1]);
    let sec = Number(timeSplits[2]);

    return (hr*60*60+min*60+sec);

}

