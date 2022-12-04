// ==UserScript==
// @name        New script
// @namespace   Violentmonkey Scripts
// @match *://student-records.vuw.ac.nz/*.P_FacStuInfo
// @version     1.0
// @author      qut3
// @grant       unsafeWindow
// @description 28/11/2022, 16:08:13
// ==/UserScript==


const IGNORE_ZEROS = true

/**
 * map of grade points corresponding letter values.
 * @type {Map<number, string>}
 */
const gradePointMap = new Map([
    [0,"D"],
    [1, "C-"],
    [2, "C"],
    [3, "C+"],
    [4, "B-"],
    [5, "B"],
    [6, "B+"],
    [7, "A-"],
    [8, "A"],
    [9, "A+"]
])

/**
 * All term numbers featured on the page
 * @type {number[]}
 */
const termTablesArray = [...document.querySelectorAll('table[summary="This table displays the student degree history information."] tbody tr td')];
let termArray = termTablesArray.map(e => parseInt(e.textContent)).filter(e => {
    return !isNaN(e);
});
console.log("slkdfj",termTablesArray)

/**
 * Map of terms to corresponding gpa of given term.
 * @type {Map<any, any>}
 */
const termGPAMap = initTermGPAMap();
function initTermGPAMap() {
    const termGPAMap = new Map();
    for (let termNumber of termArray) {
        termGPAMap.set(termNumber,getGPAFromTerm(termNumber))
    }
    return termGPAMap;
}

/**
 * Get grade table that is below term table with given term number.
 * @param termNumber
 */
function getTermGradeTable(termNumber) {
    const element = document.querySelectorAll('table[summary="This table displays the student degree history information."]');
    const slice = [...element].slice(1, [...element].length); // don't want first table as it's essentially acting as a header
    for (let table of slice) {
        const termFromTable = Number(parseInt(table.querySelector('tbody').querySelector('td').querySelector('p').querySelector('b').innerText));
        if (termFromTable === termNumber) {
            return table.nextElementSibling;
        }
    }
}

/**
 * Gets table rows and create new objects from their cells text contents.
 * @param table
 */
function getTableAsObjects(table) {
    const rows = table.rows;
    const header = rows.item(0);
    const list = [];
    for (let row of rows) {
        if (row === header) {
            continue;
        }
        const object = {};
        const cells = row.cells;
        for (let cell of cells) {
            const headerValue = header.cells.item(cell.cellIndex).textContent;
            object[headerValue] = cell.textContent;
        }
        object["term"] = table.previousElementSibling.querySelector('tbody td p b').textContent;
        list.push(object);
    }
    return list;
}

function getAllTablesAsObjects() {
    let listOfAllTablesCombined = [];
    for (let term of termArray) {
        const termGradeTable = getTermGradeTable(term);
        const tableAsObjects = getTableAsObjects(termGradeTable);
        for (let entry of tableAsObjects) {
            listOfAllTablesCombined.push(entry);
        }
    }
    return listOfAllTablesCombined;
}

window.getAllTablesAsJson = ()=> {
    let bigObj = {};
    const allTablesAsObjects = getAllTablesAsObjects();
    for (let obj of allTablesAsObjects) {
        console.log(allTablesAsObjects.indexOf(obj))
        bigObj[allTablesAsObjects.indexOf(obj)] = obj;
    }
    return bigObj;
}

getAllTablesAsJson();
/**
 * Returns GPA of given term.
 * @param termNumber
 * @returns {number|string}
 */
function getGPAFromTerm(termNumber) {
    const termGradeTable = getTermGradeTable(termNumber);
    const tableAsObjs = getTableAsObjects(termGradeTable);
    let gradesArray = tableAsObjs.map(e => {
        return Number(parseInt(e["GradePts"]));
    }).filter(e => {
        if (IGNORE_ZEROS && e === 0) {
            return false;
        }
        return !isNaN(e);
    });
    const gradesArraySum = gradesArray.reduce((a, b) => a + b, 0);
    const gpa = (gradesArraySum/gradesArray.length).toFixed(2);
    return isNaN(gpa) ? 0 : gpa;
}

/**
 * Averages GPAs of each term to get overall GPA.
 * @returns {string}
 */
function getOverallGPA() {
    let gpaArray = Array.from(termGPAMap.values()).filter(e=>{
        return !(IGNORE_ZEROS && e === 0);
    }).map(e=>Number(e));
    const gpaSum = gpaArray.reduce((a, b) => a+b, 0);
    let gpa = (gpaSum/gpaArray.length).toFixed(2);
    return gpa;
}

/**
 * Sets up GPA section below Qualification Status section.
 */
function setUpGPASection() {
    let gpaTableHTML =
        "<br>" +
        "<hr>" +
        "<table class='datadisplaytable' id='gpa_table' summary=\"This table displays the student gpa status information.\">" +
        "<caption class=\"captiontext\"><a name=\"gpa_stat\">GPA Status&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</a><a id='overall-gpa'>Overall: VAL,CLG: VAL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</a><a href=\"#top\" alt=\"TOP\">-Top-</a></caption>\n" +
        "<tbody><tr>\n" +
        "<th colspan=\"1\" class=\"ddheader\" scope=\"col\">Term</th>\n" +
        "<th colspan=\"1\" class=\"ddheader\" scope=\"col\">GPA</th>\n" +
        "<th colspan=\"1\" class=\"ddheader\" scope=\"col\">Closest Letter Grade</th>\n" +
        "</tr>" +
        "<tr>\n" +
        "\n" +
        "\n" +
        "</tr>\n" +
        "</tbody></table>";

    const qualificationStatusTable = document.querySelector('table[summary="This table displays the student qualification status information."]');
    qualificationStatusTable.insertAdjacentHTML("afterend",gpaTableHTML);

    for (let term of termArray) {
        const gpaFromTerm = getGPAFromTerm(term);
        const gpaTable = document.querySelector('#gpa_table');
        const htmlTableRowElement = gpaTable.insertRow(gpaTable.rows.length);
        const termCell = htmlTableRowElement.insertCell(0);
        termCell.className = "dddefault"
        termCell.textContent = term;
        termCell.style.width='100'
        const gpaPtsCell = htmlTableRowElement.insertCell(1);
        gpaPtsCell.className = "dddefault"
        gpaPtsCell.textContent = gpaFromTerm;
        gpaPtsCell.style.width='100'
        const gpaLetterCell = htmlTableRowElement.insertCell(2);
        gpaLetterCell.style.width='150'
        gpaLetterCell.className = "dddefault"
        if (gpaFromTerm === 0) {
            gpaLetterCell.textContent = "NA";
            continue;
        }
        gpaLetterCell.textContent = gradePointMap.get(Math.round(gpaFromTerm));
    }

    document.querySelector('#overall-gpa').innerText = `Overall: ${getOverallGPA()}, CLG: ${gradePointMap.get(Math.round(Number(getOverallGPA())))}`;
    document.querySelector('#overall-gpa').appendChild( document.createTextNode( '\u00A0\u00A0\u00A0\u00A0\u00A0' ) );

    const thesisInfoElement = document.querySelector('a[href="#thesis_info"]');
    thesisInfoElement.insertAdjacentHTML('afterend',"<a href=\"#gpa_stat\">GPA Status</a>")
    document.querySelector('a[href="#gpa_stat"]').insertAdjacentHTML('beforebegin'," &nbsp;&nbsp; ")
}

setUpGPASection();

const allTablesAsJson = getAllTablesAsJson();


var oldFunction = unsafeWindow.SomeFunctionInPage;
unsafeWindow.SomeFunctionInPage = function(text) {
    alert('Hijacked! Argument was ' + text + '.');
    return oldFunction(text);
};