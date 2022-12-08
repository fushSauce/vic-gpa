// ==UserScript==
// @name        Vic GPA
// @namespace   Violentmonkey Scripts
// @match *://student-records.vuw.ac.nz/*.P_FacStuInfo
// @version     1.0
// @author      geoCos
// @grant       unsafeWindow
// @description 28/11/2022, 16:08:13
// @license MIT
// ==/UserScript==

/**
 * Getting Data
 * ----------------------
 */

const termTables = [...document.querySelectorAll('table[summary*="degree history"]')].slice(1);

const terms = termTables.reduce((accumulator, currentValue) => {
    const number = parseInt(currentValue.querySelector('b').textContent);
    accumulator.push(number);
    return accumulator;
}, [])

const courseTables = termTables.reduce((accumulator, currentValue, currentIndex) => {
    accumulator.push(currentValue.nextElementSibling);
    return accumulator;
}, [])

const courseData = getCourseData();

let gradeArr = ['D','C-','C','C+','B-','B','B+','A-','A','A+'];

const gpaTermMap = terms.reduce((acc, curTerm, curIndex) => {
    acc.set(curTerm, getGpa(curTerm));
    return acc;
}, new Map());

const gpaArr = [...gpaTermMap.values()]
    .filter(e => e !== 0);

const overallGpa = (gpaArr.reduce((a, b) => a + b, 0)) / gpaArr.length;

const gpaInfoString = getGpaInfoString();

unsafeWindow.gpaInfo = gpaInfoString;


/**
 * Presenting
 * ----------------------
 */

/**
 * Utilities
 * ----------------------
 */

/**
 * Get all course data tables, create rows as json objects, add term as key in the json objects.
 * @returns {*}
 */
function getCourseData() {
    const reduce = termTables.reduce((termTableAccumulator, currentTermTable) => {

        const termNumber = parseInt(currentTermTable.querySelector('b').textContent);
        const courseTable = currentTermTable.nextElementSibling;
        const rows = [...courseTable.rows];
        const headerStrings = [...rows[0].cells].map(e => e.textContent);
        const dataRows = rows.slice(1);

        const dataRowReduction = dataRows.reduce((dataRowAccumulator, currentRow) => {
            const cells = [...currentRow.cells];

            const cellReduction = cells.reduce((cellAccumulator, currentCell, currentIndex) => {
                cellAccumulator[headerStrings[currentIndex]] = currentCell.textContent;
                cellAccumulator.Term = String(termNumber);
                return cellAccumulator;
            }, {});
            dataRowAccumulator.push(cellReduction);
            return dataRowAccumulator;
        }, []);

        termTableAccumulator.push([...dataRowReduction]);
        return termTableAccumulator;
    }, []);

    const combinedRows = reduce.reduce((accumulator, currentValue) => {
        currentValue.forEach(e => {
            accumulator.push(e);
        })
        return accumulator
    }, []);

    return combinedRows;
}

/**
 * Utilities
 * @param a
 * @param b
 * @returns {*}
 */
function sum(a, b) {
    return a + b;
}

/**
 * Used to get columns with numerical data and put in array
 * @param arr
 * @param header
 * @returns {*}
 */
function getColNumbers(arr, header) {
    return arr.reduce((acc, currentVal) => {
        acc.push(Number(currentVal[header]));
        return acc;
    }, []);
}

/**
 * Gets gpa for given term
 * @param termNumber
 * @returns {number}
 */
function getGpa(termNumber) {
    const termCourses = courseData.filter(e => e.Term === String(termNumber));

    const creditsArr = getColNumbers(termCourses, "Pts/CrsValue");
    const creditsArrSum = creditsArr.reduce((a, b) => a + b, 0);

    const gradesArr = getColNumbers(termCourses, "GradePts");

    const gradeXCreditSum = gradesArr.reduce((acc, curV, curI) => {
        acc += (curV * creditsArr[curI]);
        return acc;
    }, 0);

    return (gradeXCreditSum / creditsArrSum);
}


function getGpaInfoString() {
    const filter = [...gpaTermMap.entries()].filter(e => e[1] !== 0);
    const gpaSum = filter.reduce((a,b)=>a+b[1],0);
    const overallGpa = (gpaSum/filter.length);
    let data = `Overall: ${overallGpa.toFixed(2)} CLG: ${gradeArr[Math.round(overallGpa)]}\n`;

    filter.forEach(e=>{
        const term = e[0];
        const grade = e[1];
        const clg = gradeArr[Math.round(grade)];
        data += `term: ${term} grade: ${grade.toFixed(2)} CLG: ${clg}\n`;
    })
    return data;
}



