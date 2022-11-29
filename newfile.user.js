// ==UserScript==
// @name        New script
// @namespace   Violentmonkey Scripts
// @match *://student-records.vuw.ac.nz/*.P_FacStuInfo
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @grant       none
// @version     1.0
// @author      qut3
// @description 28/11/2022, 16:08:13
// ==/UserScript==


const gradeTableList = document.querySelectorAll('[summary="This table displays the student course history information."]') // First element
const termTableList = document.querySelectorAll('[summary="This table displays the student degree history information."]');

const INCLUDE_ZEROS = Boolean(false);
const GRADE_POINTS_COL_INDEX = 7;
const TERM_INDEX = 1;

/**
 * gets gpa from a table by iterating grade point column and averaging
 * @param table
 * @returns {number}
 */ function getGPA(table) {
    const tRows = table.tBodies[0].rows;
    let sum = 0;
    let count = 0;
    for (let row =1; row <tRows.length; row++) {
        const cells = tRows.item(row).cells;
        const gradePointText = cells.item(GRADE_POINTS_COL_INDEX).textContent;
        const gradePointInt = Number(parseFloat(gradePointText));
        if (isNaN(gradePointInt) ) { continue }
        if (gradePointInt === 0) {
            continue;
        }
        sum+=gradePointInt;
        count++;
    }
    const res = Number(parseFloat(sum / count).toFixed(2));
    return isNaN(res) ? 0 : res;
}

/**
 * Goes through all gradeTables and gets average
 * @param tableList
 * @returns {number}
 */
function getFullGPA(tableList) {
    let sum = 0;
    let count = 0;
    for (let tableInd=0; tableInd < tableList.length;tableInd++) {
        var table = tableList.item(tableInd);
        var gpa = getGPA(table);
        gpa = Number(gpa);
        if (!INCLUDE_ZEROS && gpa === 0) {
            continue;
        }
        sum+=gpa;
        count++;
    }
    return Number(parseFloat(sum/count).toFixed(2));
}

/**
 * Term 202001
 *  gpa: 7
 * Term 202101
 *  gpa: 6.5
 * Term 202201
 *  gpa: 5.83
 * Full gpa: (5.83+6.5+7)/3 = 6.44
 */

/**
 * gets table above course table showing the term and degree
 * @param term
 * @returns {Element}
 */
function getTermTable(term) {
    console.log(termTableList)
    for (let termIndex = 0; termIndex < termTableList.length; termIndex++) {
        const termTable = termTableList.item(termIndex);
        const termTableBody = termTable.tBodies[0];
        const termTableRow = termTableBody.rows[0];
        const rowCells = termTableRow.cells;
        if (rowCells.length < 4) {continue}
        const termTextContent = rowCells.item(TERM_INDEX).childNodes.item(0).childNodes.item(0).textContent;
        if (term === termTextContent) {
            return termTable;
        }
    }
}

/**
 * gets GPA of given term string
 * @param term
 * @returns {number}
 */
function getTermGPA(term) {
    const termTable = getTermTable(term);
    const courseTable = termTable.nextElementSibling;
    return getGPA(courseTable);
}

function generateTermGPAMap() {
    const map = new Map();
    for (let termIndex = 0; termIndex < termTableList.length; termIndex++) {
        const termTable = termTableList.item(termIndex);
        const termTableBody = termTable.tBodies[0];
        const termTableRow = termTableBody.rows[0];
        const rowCells = termTableRow.cells;
        if (rowCells.length < 4) {continue}
        const termTextContent = rowCells.item(TERM_INDEX).childNodes.item(0).childNodes.item(0).textContent;
        map.set(termTextContent,getTermGPA(termTextContent))
    }
    return map;
}
function testFunc() {
    var termGPAMap = generateTermGPAMap();
    termGPAMap.set("overall",getFullGPA(gradeTableList))
    var obj = Object.fromEntries(termGPAMap);
    var jsonString = JSON.stringify(obj,null,'\t');

    let table = document.createElement('table');
    let thead = document.createElement('thead');
    let tbody = document.createElement('tbody');

    const captionElement = document.createElement('caption');
    captionElement.setAttribute("class","captiontext")
    table.appendChild(captionElement);

    const a1 = document.createElement('a');
    a1.setAttribute('name','gpa_stat')
    a1.innerHTML = "GPA Status&nbsp;&nbsp;&nbsp;&nbsp;"
    const a2 = document.createElement('a');
    a2.setAttribute('href','#top');
    a2.setAttribute('alt','TOP');
    a2.innerHTML = "-Top-"
    captionElement.appendChild(a1);
    captionElement.appendChild(a2)

    table.appendChild(thead);
    table.appendChild(tbody);

    table.setAttribute('class','datadisplaytable')
    table.setAttribute("summary","This table displays the student qualification status information.")
    table.setAttribute('width','300')


    const qualElement = document.querySelector('[summary="This table displays the student qualification status information."]');
    const br = qualElement.insertAdjacentElement('afterend', document.createElement('br'));
    const hr = br.insertAdjacentElement('afterend', document.createElement('hr'));
    table = hr.insertAdjacentElement('afterend', table);

    const row0 = tbody.insertRow(0);
    const th1 = document.createElement('th');
    th1.setAttribute('colspan',1);
    th1.setAttribute('class','ddheader');
    th1.setAttribute('scope','col')
    th1.innerHTML = "Term"

    const th2 = document.createElement('th');
    th2.setAttribute('colspan',1);
    th2.setAttribute('class','ddheader');
    th2.setAttribute('scope','col')
    th2.innerHTML = "GPA"

    row0.appendChild(th1);
    row0.appendChild(th2);


    let count = 1;
    for (let [key, value] of termGPAMap.entries()) {
        console.log("key: " + key)
        const row = tbody.insertRow(count);


        const td1 = document.createElement('td');
        td1.setAttribute('colspan',1);
        td1.setAttribute('class','dddefault');
        td1.setAttribute('scope','col')
        td1.innerHTML = key

        row.appendChild(td1);

        const td2 = document.createElement('td');
        td2.setAttribute('colspan',1);
        td2.setAttribute('class','dddefault');
        td2.setAttribute('scope','col')
        td2.innerHTML = value

        row.appendChild(td2)

        count++;
    }
}

function addGPAButton() {
    // const thesisLink = document.querySelector('[href="#thesis_info"]');
    // thesisLink.insertAdjacentHTML("afterend",'\n' + '&nbsp;&nbsp;\n <a href="javascript:" fart="gpa-link">GPA</a>');
    // const gpaLink = document.querySelector('[fart="gpa-link"]');
    // gpaLink.addEventListener("click",()=>{
    //     testFunc();
    // })
    testFunc();

}
addGPAButton();

