const $ = require("jquery");
const electron = require("electron");
const fs = require("fs");
const dialog = require("electron").remote.dialog;
$(document).ready(
    function () {
        let db = [];
        $("#grid .cell").on("click", function () {
            let rid = Number($(this).attr("row-id"));
            let cid = Number($(this).attr("col-id"));
            let ciAdrr = String.fromCharCode(cid + 65);
            // console.log((rid + 1) + "   " + (cid + 1) + "   " + ciAdrr)
            $("#address-container").val(ciAdrr + (rid + 1));
        })

        $(".menu-items").on("click", function () {
            $(".menu-options-item").removeClass("selected");
            let id = $(this).attr("id");
            $(`#${id}-options`).addClass("selected");
        })
    })

$(document).ready(
    function () {
        db = [];
        $("grid .cell").on("click", function () {

        })
        $(".menu-items").on("click", function () {

        })
        $("#New").on("click", function () {
            db = [];
            // $("#grid").find(".row").each(function () {
            //     let row = [];
            //     $(this).find(".cell").each(function () {
            //         let cell = false;
            //         row.push(cell);
            //         $(this).html("false");
            //     })
            //     db.push(row)
            // })
            let rows = $("#grid").find(".row");

            for (let i = 0; i < rows.length; i++) {
                let row = [];
                let cRowCells = $(rows[i]).find(".cell");
                for (let j = 0; j < cRowCells.length; j++) {
                    // DB
                    let cell = {
                        value: "",
                        formula: ""
                    }
                    row.push(cell);
                    // UI 
                    $(cRowCells[j]).html("");
                }
                db.push(row);
            }
            console.log(db);
        })
           //keyup
        // $("#grid .cell").on("blur", function () {
        //    let rowId = $(this).attr("row-id");
        //     let colId = $(this).attr("col-id");
        //     db[rowId][colId] = $(this).html();
        //     // console.log(db);

        // })

        $("#Save").on("click", async function () {
            let sdb = dialog.showSaveDialogSync();
            let jsonData = JSON.stringify(db);
            // console.log(sdb);
            fs.writeFileSync(sdb, jsonData,"utf-8");
        })

        // let fileSaver=document.querySelector("#File-saver");
        // fileSaver.addEventListener("change",function()
        // {

        // })
        $("#Open").on("click", async function () {
            let odb = await dialog.showOpenDialog();
            // console.log(odb);
            let fp = odb.filePaths[0];
            // console.log(fp);
            let content = fs.readFileSync(fp);

            db = JSON.parse(content);

            let rows = $("#grid").find(".row");
            for (let i = 0; i < rows.length; i++) {
                let cRowCells = $(rows[i]).find(".cell");
                for (let j = 0; j < cRowCells.length; j++) {

                    $(cRowCells[j]).html(db[i][j].value);
                }

            }

        })
      
        $("#grid .cell").on("blur", function () {
            // updated db
            // console.log(this);
            // console.log("cell fn")
            // lsc = this;
            let { rowId, colId } = getRc(this);

            let cellObject = getCellObject(rowId, colId);
            console.log("Cell object is"+cellObject);
            
            if ($(this).html() == cellObject.value) {
                return
            }
            let formula = cellObject.formula;
            cellObject.value = $(this).html();
            cellObject.formula = formula;
            // updateCell=> update self // childrens(UI changes)
            updateCell(rowId, colId, $(this).html(), cellObject);
            // console.log(db);
        })
        $("#formula-container").on("blur", function () {
            // console.log("Formula fn")
            // console.log(this);
            // console.log(lsc);
            //   cell 
            let address = $("#address-container").val();
            
            // console.log(address);
            let { rowId, colId } = getRcFromAddress(address);
            // set formula
            let cellObject = getCellObject(rowId, colId);
            let formula = $(this).val();
            // console.log("The formula in parent is"+formula);
            cellObject.formula = formula;
            // console.log(cellObject);
            let eValuatedVal = evaluate(cellObject);
            updateCell(rowId, colId, eValuatedVal, cellObject);

            // setUpFormula(rowId, colId, formula);
            // evaluate
            // update cell
        })
        function setUpFormula(rowId, colId, formula) {
            // parent  downstream add
            let cellObject = getCellObject(rowId, colId);

            // ( A1 + A2 )
            //    ( A1 + A2 )
            let formulaComponent = formula.split(" ");
            // [(,A1,+,A2,)]

            for (let i = 0; i < formulaComponent.length; i++) {
                let code = formulaComponent[i].charCodeAt(0);

                if (code >= 65 && code <= 90) {

                    let parentRc = getRcFromAddress(formulaComponent[i]);
                    let fParent = db[parentRc.rowId][parentRc.colId];

                    // set yourself to your parent's downstream
                    fParent.downstream.push({
                        rowId, colId
                    })
                    // // evaluate 
                    // cellObject.upstream.push({
                    //     rowId: parentRc.rowId,
                    //     colId: parentRc.colId
                    // })

                }

            }
        }
        function evaluate(cellObject) {
            // console.log(cellObject+"Child's process");
            let formula = cellObject.formula;
            // console.log("The formula is"+formula);
            // ( A1 + A2 )
            let formulaComponent = formula.split(" ");
            // [( ,A1,+,A2,)]
            for (let i = 0; i < formulaComponent.length; i++) {
                let code = formulaComponent[i].charCodeAt(0);
                if (code >= 65 && code <= 90) {
                    let parentRc = getRcFromAddress(formulaComponent[i]);

                    let fParent = db[parentRc.rowId][parentRc.colId];
                    let value = fParent.value;
                    formula = formula.replace(formulaComponent[i], value)
                }

            }
            // ( 10 + 20 )
            // console.log(formula);
            let ans = eval(formula);
            // console.log(ans);
            return ans;
            // console.log(formula)
            // for (let i = 0; i < cellObject.upstream.length; i++) {
            //     let suo = cellObject.upstream[i];
            //     let fParentObject = db[suo.rowId][suo.colId];
            //     let val = fParentObject.value;
            //     // formula => replace A1 => 10
            //     let colAlpha = String.fromCharCode(suo.colId + 65);
            //     let rowNumber = suo.rowId + 1;
            //     let charMeParent = colAlpha + rowNumber;
            //     formula = formula.replace(charMeParent, val);
            // }
            // console.log(formula);
            // let ans = eval(formula);
            // console.log(ans);
            // return ans;
        }
        function updateCell(rowId, colId, val, cellObject) {
            // update yourself
            $(`#grid .cell[row-id=${rowId}][col-id=${colId}]`).html(val);
            cellObject.value = val;

            // dependent 
            // let cellObject = getCellObject(rowId, colId);
            // for (let i = 0; i < cellObject.downstream.length; i++) {
            //     let schild = cellObject.downstream[i];
            //     let fChildObj = db[schild.rowId][schild.colId];
            //     let eValuatedVal = evaluate(fChildObj);
            //     updateCell(schild.rowId, schild.colId, eValuatedVal)

            // }
        }
        function getRcFromAddress(address) {
            let colId = address.charCodeAt(0) - 65;
            let rowId = Number(address.substring(1)) - 1;
            return { colId, rowId };

        }

        function getRc(elem) {
            let rowId = $(elem).attr("row-id");
            let colId = $(elem).attr("col-id");
            return {
                rowId,
                colId
            }
        }

        function getCellObject(rowId, colId) {
            // console.log("Cell object is", db[rowId][colId]);
            console.log(db[rowId][colId]+"get fn");
            return  db[rowId][colId];
        }
        function init() {
            $("#File").trigger("click");
            $("#New").click();
        }
        init();

    }
);

        