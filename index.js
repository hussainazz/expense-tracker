import fs from 'node:fs'
import yargs from 'yargs'

let argv = 
    yargs(process.argv.slice(2))
    .parse()
let command = argv._[0]?.toLowerCase()
let tracks = []
let budgets = {}

let errorHandling = {
    isInitialized: (obj, prop) => {
        try{
            if(!obj[prop])
                throw `notInitialized`
            return true
        }
        catch{
            console.error(`You didn't initialized the ${prop}.`)
            return false
        }
    },
    isNotEmpty: (obj, prop) => {
        try{
            if(obj[prop] === true)
                throw `notDefined`
            return true
        }
        catch{
            console.error(`${prop} can't be empty.`)
            return false
        }
    },
    isPositiveNumber: (obj, prop) => {
        try {
            if(isNaN(obj[prop]))
                throw `notNum`
            if(obj[prop] < 0)
                throw `negative`
            return true
        }
        catch(error) { 
            if(error === `notNum`)
                console.error(`${prop} should be a number.`)
            if(error === `negative`)
                console.error(`${prop} should be a positive number.`)
            return false
        }
    },
    isValidMonthRange: (num) => {
        let monthRange = Array.from({length: 12}, (x, i) => i + 1)
        try {
            if(!monthRange.includes(num)){ 
                throw `rangeErr`
            }
            return true
        } catch {
            console.error(`Month should be in range of 1-12`)
            return false
        }
    } 
}

function writeFile() {
    // create/store-in final data in json file
    if(budgets)
        (function sortBudgetsByMonth() {
            let finalBudgets = {}
            let budgetsKeys = Object.keys(budgets)
            budgetsKeys.forEach(month => finalBudgets[month] = budgets[month])
            budgets = finalBudgets
        })()
    fs.writeFileSync(`expense-tracks.json`,JSON.stringify({expenseTracks: tracks, budgets: budgets}))
}
function currentDate() {
    const today = new Date()
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const formattedDate = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
    return formattedDate
}
function numberToMonth(num) {
    return Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(num))
}

try {
    let dataBase = JSON.parse(fs.readFileSync(`expense-tracks.json`))
    tracks = dataBase.expenseTracks
    budgets = dataBase.budgets
} catch {
    writeFile()
}

switch(command) {
    case 'add': addTrack(); break
    case 'list': list(); break
    case 'summary': summary(argv.month); break
    case 'delete': deleteTrack(); break
    case 'budget': budgetHandler(); break
    default:
        console.error(`Command should be add/list/summary/delete/budget`); break
}

function addTrack() {
    let newId = tracks.length + 1

    if(tracks.some(item => item.id == newId)) newId += 1

    if(errorHandling.isInitialized(argv, "description"))
        if(errorHandling.isNotEmpty(argv, "description"))
            if(errorHandling.isInitialized(argv, "amount"))
                if(errorHandling.isNotEmpty(argv, "amount"))
                    if(errorHandling.isPositiveNumber(argv, "amount"))
                        if(errorHandling.isNotEmpty(argv, "category"))
                            ""
                        else return
                    else return
                else return
            else return
        else return
    else return

    tracks.push({
        id: newId,
        date: currentDate(),
        description: argv.description,
        amount: argv.amount,
        category: argv?.category || 'none'
    })
    console.log(`Expense added successfully. ID : ${newId}`)
    budgetAfter_add_delete(-argv.amount, newId)
}

function deleteTrack() {
    
    if(errorHandling.isInitialized(argv, 'id'))
        if(errorHandling.isNotEmpty(argv, 'id'))
            if(errorHandling.isPositiveNumber(argv, 'id'))
                ""
            else return 
        else return
    else return

    try {
        if(!tracks.some(item => item.id == argv.id)) throw `foundNoTrack`

        let deletedExpenseAmount = tracks.find(item => item.id == argv.id).amount
        console.log(`Expense deleted successfully. ID : ${argv.id}`)
        budgetAfter_add_delete(deletedExpenseAmount, argv.id)
        tracks = tracks.filter(item => item.id != argv.id)
        writeFile()
    }
    catch {
        console.error(`This ID doesn't exist `)
    }
}
function list() {
    let filterExpensesByCategory
    let filterExpensesByMonth

    if(argv.category)
        if(errorHandling.isNotEmpty(argv, "category")) {
            filterExpensesByCategory = tracks.filter(item => item.category === argv.category)
            console.table(filterExpensesByCategory)
        }
        else return

    else if(argv.month) 
        if(errorHandling.isNotEmpty(argv, "month")) {
            if(errorHandling.isPositiveNumber(argv, "month")) {
                if(errorHandling.isValidMonthRange(argv.month)) {
                    filterExpensesByMonth = tracks.filter(item => splitMonth(item.date) === argv.month)
                    console.table(filterExpensesByMonth)
                }
                else return
            }
            else return
        }
        else return

    else console.table(tracks)
}
// fix sum. literal use and in finalbudget calcluation use.
function summary(month) {
    let summary = 0
    if(month) {
        let filterExpensesByMonth = tracks.filter(item => splitMonth(item.date) == argv.month)
        filterExpensesByMonth.forEach(item => summary += item.amount)
        if(command === 'summary'){
            if(argv.month) {
                if(errorHandling.isNotEmpty(argv, "month")) {
                    if(errorHandling.isValidMonthRange(argv.month))
                        ""
                    else return
                }
            }
            console.log(`Total expenses for ${numberToMonth(`${argv.month}`)}:`, summary)
        }
        return summary
    }
    else {
        tracks.forEach(item => summary += item.amount)
        console.log(`Total expenses: `, summary)
        return summary
    }
}

function budgetHandler() {
    if(argv.remove && (argv.month || argv.amount)) {
        console.error(`For adding budget: budget --month <number> --id <number>`)
        console.error(`For removing budget: budget --remove <number(month)>`)
    }
    else if(argv.remove) {
        if(errorHandling.isNotEmpty(argv, "remove"))
            if(errorHandling.isValidMonthRange) 
                deleteBudget()
    }
    else if(argv.month || argv.amount) {
        if(errorHandling.isInitialized(argv, "month"))
            if(errorHandling.isNotEmpty(argv, "month"))
                if(errorHandling.isValidMonthRange(argv.month))
                    if(errorHandling.isInitialized(argv, "amount"))
                        if(errorHandling.isNotEmpty(argv, "amount"))
                            if(errorHandling.isPositiveNumber(argv, "amount"))
                                finalBudgetAmount()
                            else return
                        else return
                    else return
                else return
            else return
        else return
    }

    function deleteBudget() {
        if(budgets[argv.remove]) {
            delete budgets[argv.remove]
            console.log(numberToMonth(`${argv.remove}`), ` budget removed successfully.`)
            writeFile()
        }
        else {
            console.error(`No budget has been set for `, numberToMonth(`${argv.remove}`))
        }
    }
    function finalBudgetAmount() { //TODO
        let currentMonth = splitMonth(currentDate())

        if(currentMonth < argv.month)
            console.error(numberToMonth(argv.month.toString()), ``)
    }
}
function budgetAfter_add_delete(expenseAmount, expenseId) {
    let month = find_splitMonth(expenseId)

    let thisMonthBudget = budgets[month]
    if(thisMonthBudget) {
        let remainedMonthBudget = thisMonthBudget + expenseAmount
        try {
            if(remainedMonthBudget < 0)
                throw `budgetNegative`
        }
        catch {
            console.warn(`Warning! Expenses has passed the budget. The remained budget for this month: ${remainedMonthBudget}`)
        }
        budgets[month] = remainedMonthBudget
        console.log(`${numberToMonth(`${month}`)} budget remaining: `,remainedMonthBudget)
    }
    writeFile()
}
function find_splitMonth(expenseId) {
    let splitMonth = tracks.find(item => item.id == expenseId)?.date
    splitMonth = parseInt(splitMonth?.slice(5,7))
    return splitMonth
}
function splitMonth(date) {
    let splitedMonth = parseInt(date?.slice(5,7))
    return splitedMonth
}
// TODO 
//      let user to set budget only for future