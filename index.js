import fs from 'node:fs'
import yargs from 'yargs'

let argv = 
    yargs(process.argv.slice(2))
    .parse()
let command = argv._[0]?.toLowerCase()
let tracks = []
let budget = []

try {
    let dataBase = JSON.parse(fs.readFileSync(`expense-tracks.json`))
    tracks = dataBase.expenseTracks
    budget = dataBase.budget
} catch {
    writeFile()
}

let errorHandling = {
    isInitialized: (obj, prop) => {
        try{
            if(!obj[prop])
                throw `notInitialized`
        }
        catch{
            console.error(`You didn't initialized the ${prop}.`)
        }
    },
    isNotEmpty: (obj, prop) => {
        try{
            if(obj[prop] === true)
                throw `notDefined`
        }
        catch{
            console.error(`${prop} can't be empty.`)
        }
    },
    isPositiveNumber: (obj, prop) => {
        try {
            if(isNaN(obj[prop]))
                throw `notNum`
            if(obj[prop] < 0)
                throw `negative`
            // return true
        }
        catch(error) { 
            if(error === `notNum`)
                console.error(`${prop} should be a number.`)
            if(error === `negative`)
                console.error(`${prop} should be a positive number.`)
            // return false
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
    (function sortBudgetByMonth() {
        let finalBudget = []
        let budgetKeys = 
            budget
                .map(item => Number(Object.keys(item)))
                .sort((a,b) => {return a - b})
        budgetKeys.forEach(month => finalBudget.push( {
            [month]: Object.values(budget.find(item => Object.keys(item) == month))[0]
        } ) )
        budget = finalBudget
    })()
    fs.writeFileSync(`expense-tracks.json`,JSON.stringify({expenseTracks: tracks, budget: budget}))
}

switch(command) {
    case 'add': addTrack(); break
    case 'list': list(); break
    case 'summary': summary(argv.month); break
    case 'delete': deleteTrack(); break
    case 'budget': budgetHandler(); break
    default:
        // console.error(`Command should be add/list/summary/delete/budget`); break
}

function addTrack() {
    let newId = tracks.length + 1
    if(tracks.some(item => item.id == newId))
        newId += 1
    try {
        // let argvKeys = Object.keys(argv)
        // let checkOrder = argvKeys.indexOf('amount') < argvKeys.indexOf('description')
        // if((!argv.description && !argv.amount) || checkOrder || (argv.amount  && !argv.description))
        //     throw `invalidCommand`
        if(!argv.description) throw `descriptionUndefined`
        if(argv.description === true) throw `descriptionEmpty`
        if(!argv.amount) throw `amountUndefined`
        if(argv.amount === true) throw `amountEmpty`
        isPositiveNumber(argv, 'amount')
        if(typeof(argv.category) === 'boolean')
            throw `categoryEmpty`
        tracks.push({
            id: newId,
            date: currentDate(),
            description: argv.description,
            amount: argv.amount,
            category: argv?.category || 'none'
        })
        budgetAfter_add_delete(-argv.amount, newId)
        console.log(`Expense added successfully. ID : ${newId}`)
    }
    catch(error) {
        switch(error){
            // case 'invalidCommand':
            //     console.error(`The command structure for adding tracks should be: add --description '<text>' --amount <number> [--category <text>]`); break
            case `descriptionUndefined`: console.error(`You didn't initialize the description.`); break
            case 'descriptionEmpty': console.error(`Description should not be empty`); break
            case `amountUndefined`: console.error(`You didn't initalize the amount`); break
            case 'amountEmpty': console.error(`Amount can't not be empty`); break
            case 'amountNegative':
                console.error(`Amount should be positive number`); break
            case 'amountNotNum':
                console.error(`Amount should be a number`); break
            case 'categoryEmpty':
                console.error(`Category is empty`)
            }
    }
}
function currentDate() {
    const today = new Date()
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const formattedDate = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
    return formattedDate
}
function deleteTrack() {
    let trackId = argv.id
    
    try {
        if(!trackId || typeof(trackId) === 'boolean')
            throw `emptyId`
        if(typeof(trackId) != 'number')
            throw `notNumber`
        if(!tracks.some(item => item.id == trackId))
            throw `foundNoTrack`
        let deletedExpenseAmount = tracks.find(item => item.id == trackId).amount
        console.log(`Expense deleted successfully. ID : ${trackId}`)
        budgetAfter_add_delete(deletedExpenseAmount, trackId)
        tracks = tracks.filter(item => item.id != trackId)
        writeFile()
    }
    catch(error) {
        if(error === `emptyId`)
            console.error(`For deleting track: delete --id <number>`)
        if(error === `notNumber`)
            console.error(`The ID should be a number`)
        if(error === `foundNoTrack`)
            console.error(`This ID doesn't exist `)
    }
}
function list() {
    let filterTrackByCategory
    let filterTrackByMonth
    if(isArgvPropValid(argv.category)) {
        filterTrackByCategory = tracks.filter(item => item.category === argv.category)
        console.table(filterTrackByCategory)
    }
    else if(argv.month !== undefined && typeof(argv.month) !== 'boolean') {
        isPositiveNumber(argv, 'month')
        isMonthInRange(argv.month)
        filterTrackByMonth = tracks.filter(item => splitMonth(item.date) === argv.month)
        console.table(filterTrackByMonth)
    }
    else
        console.table(tracks)
}
function isMonthInRange(num) {
    let monthRange = Array.from({length: 12}, (x, i) => i + 1)
    try {
        if(!monthRange.includes(num)){ 
            throw err
        }
        return true
    } catch {
        console.error(`Month should be in range of 1-12`)
        return false
    }
}
function numberToMonth(num) {
    return Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(num))
}
function summary(month) {
    let summary = 0
    if(month) {
        let currentMonth = splitMonth(currentDate())
        try {
            if(typeof(month) === 'boolean')
                throw `empty`
            if(isNaN(month))
                throw `notNum`
            isMonthInRange(month)
            let filterTracksByMonth = tracks.filter(item => parseInt(item.date.slice(5,7)) == month)
            filterTracksByMonth.forEach(item => summary += item.amount)
            if(month != currentMonth)
                console.log(`Total expenses for ${numberToMonth(`${month}`)}:`, summary)
            return summary
        }
        catch(error) {
            if(error === `empty`)
                console.error(`You haven't initialized the month`)
            if(error === `notNum`)
                console.error(`Month value should be a number`)
            if(error === `rangeErr`)
                console.error(`Month should be in range of 1-12`)
        }
    }
    else {
        tracks.forEach(item => summary += item.amount)
        console.log(`Total expenses: `, summary)
        return summary
    }
}
function budgetHandler() {
    if(argv.remove !== undefined && typeof(argv.remove) !== 'boolean') {
        function deleteBudget() {
            if(isPositiveNumber(argv, 'remove')) {
                if(isMonthInRange(argv.remove)) {
                    let haveMonthBudget = budget.some(item => Object.keys(item) == argv.remove)
                    if(haveMonthBudget) {
                        removeBudget(argv.remove)
                        console.log(`${numberToMonth(`${argv.remove}`)} budget removed successfully.`)
                    }
                    else {
                        console.error(`No budget has been set for ${numberToMonth(`${argv.remove}.`)}`)
                    }
                }
            }
        }
        deleteBudget()
        return
    }
    else if(argv.remove === undefined && typeof(argv.remove) === 'boolean') {
        console.error(`You didn't initialize the month to have its budget removed.`)
        return
    }

    if(argv.amount !== undefined && typeof(argv.amount) !== 'boolean') {
        (function initializeBudget() { 
            if(isPositiveNumber(argv, 'amount')) {
                if(argv.month !== undefined && typeof(argv.month) !== 'boolean'){
                    if(isPositiveNumber(argv, 'month') && isMonthInRange(argv.month)) {
                        let budgetKeys = budget.map(item => Object.keys(item)[0])
                        let budgetAlreadyExist
                        if(budgetKeys.length > 0) {
                            budgetAlreadyExist = budgetKeys.includes(`${argv.month}`)
                        }
                        (function finalBudgetAmount() {
                                let currentMonth = splitMonth(currentDate())
                                let currentMonthSum
                                let finalBudget
                                if(currentMonth == argv.month) {
                                    currentMonthSum = summary(currentMonth)
                                }
                                if(currentMonthSum) {
                                    finalBudget = argv.amount - currentMonthSum
                                }
                                else {
                                    finalBudget = argv.amount
                                }
                                if(budgetAlreadyExist) {
                                    budget.find(item => Object.keys(item) == argv.month)[argv.month] = finalBudget
                                    console.log(`${numberToMonth(`${argv.month}`)} budget updated to $${budget.find(item => Object.keys(item) == argv.month)[argv.month]}`)
                                }
                                else {
                                    budget.push({ [argv.month] : finalBudget })
                                    console.log(`${numberToMonth(`${argv.month}`)} budget remaining: $${budget.find(item => Object.keys(item) == argv.month)[argv.month]}`)
                                }
                        })()
                        writeFile()
                    }
                }
                else {
                    console.error(`You didn't initialize the month.`)
                }
            }
        })()
    }
    else {
        console.error(`You didn't initialize the amount`)
    }
    function removeBudget(month) {
        budget = budget.filter(item => Object.keys(item) != month)
        writeFile()
    }
}
function isPositiveNumber(obj, prop) {
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
}
function budgetAfter_add_delete(expenseAmount, expenseId) {
    let month = find_splitMonth(expenseId)

    let thisMonthBudget = budget.find(item => Object.keys(item) == month)[month]
    if(thisMonthBudget) {
        let remainedMonthBudget = thisMonthBudget + expenseAmount
        try {
            if(remainedMonthBudget < 0)
                throw `budgetNegative`
        }
        catch {
            console.warn(`Warning! Expenses has passed the budget. The remained budget for this month: ${remainedMonthBudget}`)
        }
        budget.find(item => Object.keys(item) == month)[month] = remainedMonthBudget
        console.log(budget)
        console.log(`${numberToMonth(`${month}`)} budget remaining: `,remainedMonthBudget)
        writeFile()
    }
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