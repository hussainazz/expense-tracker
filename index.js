import fs from 'node:fs'
import yargs from 'yargs'

let argv = yargs(process.argv.slice(2)).parse()
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

function writeFile() {
    (function sortBudget() {
        let finalBudget = []
        let budgetKeys = budget.map(item => Number(Object.keys(item)))
        budgetKeys = budgetKeys.sort((a,b) => {return a - b})
        budgetKeys.forEach(month => finalBudget.push( {
            [month]: Object.values(budget.find(item => Object.keys(item) == month))[0]
        } ) )
        budget = finalBudget
    })()
    fs.writeFileSync(`expense-tracks.json`,JSON.stringify({expenseTracks: tracks, budget: budget}))
}

// command = add/list/summary/delete/budget

switch(command) {
    case 'add': addTrack(); break
    case 'list': list(); break
    case 'summary': summary(argv.month); break
    case 'delete': deleteTrack(); break
    case 'budget': budgetHandler(); break
    default:
        console.error(`command should be add/list/summary/delete`); break
}
function addTrack() {
    let newId = tracks.length + 1
    if(tracks.some(item => item.id == newId))
        newId += 1
    try {
        let argvKeys = Object.keys(argv)
        let checkOrder = argvKeys.indexOf('amount') < argvKeys.indexOf('description')
        // The parser coerces the argument if the user doesn't set value, boolean type check is because of this matter  
        if((!argv.description && !argv.amount) || checkOrder || (argv.amount  && !argv.description))
            throw `invalidCommand`
        if(typeof(argv.description) === 'boolean' || !argv.description)
            throw `descriptionEmpty`
        if(typeof(argv.amount) === 'boolean' || !argv.amount)
            throw `amountEmpty`
        if(argv.amount < 0)
            throw `amountNegative`
        if(typeof(argv.amount) !== 'number')
            throw `amountNotNum`
        if(typeof(argv.category) === 'boolean')
            throw `categoryEmpty`
        tracks.push({
            id: newId,
            date: formattedDate(),
            description: argv.description,
            amount: argv.amount,
            category: argv?.category || 'none'
        })
        console.log(`Expense added successfully. ID : ${newId}`)
        writeFile()
        budgetAfter_add_delete(-argv.amount, newId)
        
    } 
    catch(error) {
        switch(error){
            case 'invalidCommand':
                console.error(`The command structure for adding tracks should be: add --description '<text>' --amount <number> [--category <text>]`); break
            case 'descriptionEmpty':
                console.error(`Description should not be empty`); break
            case 'amountEmpty':
                console.error('Amount should not be empty'); break
            case 'amountNegative':
                console.error(`Amount should be positive number`); break
            case 'amountNotNum':
                console.error(`Amount should be a number`); break
            case 'categoryEmpty':
                console.error(`Category is empty`)
            }
    }
}
function formattedDate() {
    let today = new Date()
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
        let deletedExpenseAmount = tracks.find(item => item.id === trackId).amount
        console.log(`Expense deleted successfully. ID : ${trackId}`)
        budgetAfter_add_delete(+deletedExpenseAmount, trackId)
        tracks = tracks.filter(item => item.id !== trackId)
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
    if(argv.category !== undefined && typeof(argv.category) !== 'boolean') {
        filterTrackByCategory = tracks.filter(item => item.category === argv.category)
        console.table(filterTrackByCategory)
    }
    else
        console.table(tracks)
}
function monthRaneCheck(num) {
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
        let currentMonth = splitMonthByDate(formattedDate())
        try {
            if(typeof(month) === 'boolean')
                throw `empty`
            if(isNaN(month))
                throw `notNum`
            monthRaneCheck(month)

            let filterTracksByMonth = tracks.filter(item => parseInt(item.date.slice(5,7)) === month)
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
    if(argv.remove !== undefined && typeof(argv.remove) !== 'boolean'){
        (function deleteBudget() {
            if(isValValid(argv, 'remove')) {
                if(monthRaneCheck(argv.remove)) {
                    let haveMonthBudget = budget.some(item => Object.keys(item) == argv.remove)
                    if(haveMonthBudget) {
                        removeBudget(argv.remove)
                        console.log(`Budget removed for ${numberToMonth(`${argv.remove}`)}`)
                        return
                    }
                    else {
                        console.error(`No budget had been set for ${numberToMonth(`${argv.remove}`)}`)
                        return
                    }
                }
                else
                    return
            }
            else
                return
        })()
        return
    }
    else if(argv.remove === undefined && typeof(argv.remove) === 'boolean') {
        console.error(`You didn't initialize the month to have its budget removed.`)
        return
    }

    if(argv.amount !== undefined && typeof(argv.amount) !== 'boolean') {
        (function initializeBudget() {
            let isAmountValValid = isValValid(argv, 'amount')
            if(isAmountValValid) {
                if(argv.month !== undefined && typeof(argv.month) !== 'boolean'){
                    let isMonthValValid = isValValid(argv, 'month')
                    if(isMonthValValid) {
                        

                        let budgetKeys = budget.map(item => Object.keys(item)[0])
                        let budgetAlreadyExist = budgetKeys.includes(argv.month.toString())
                        if(budgetAlreadyExist) {
                            budget
                                .find(item => Object.keys(item) == argv.month)
                                [argv.month.toString()] = argv.amount
                            substractPreviousExpensesFromNewSetBudget(argv.month)
                            console.log(`${numberToMonth(`${argv.month}`)} budget updated to $${budget.find(item => Object.keys(item) == argv.month)[argv.month]}`)
                        }
                        else {
                            budget.push({ [argv.month] : argv.amount })
                            substractPreviousExpensesFromNewSetBudget(argv.month)

                            console.log(`${numberToMonth(`${argv.month}`)} budget set to $${budget.find(item => Object.keys(item) == argv.month)[argv.month]}`)
                        }
                        writeFile()
                    }
                }
                else
                    console.error(`You didn't initialize the month`)
            }
        })()
    }
    else
        console.error(`You didn't initialize the amount`)

    function removeBudget(month) {
        budget = budget.filter(item => Object.keys(item) != month)
        writeFile()
    }

    function isValValid(obj, prop) {
        try {
            if(isNaN(obj[prop]))
                throw `notNum`
            if(obj[prop] < 0)
                throw `negative`
            return true
        }
        catch(error) { 
            if(error === `notNum`)
                console.error(`${prop} should be number`)
            if(error === `negative`)
                console.error(`${prop} should be positive number`)
            return false
        }
    }
}

function budgetAfter_add_delete(amount, /* month, */ expenseId) {
    let month = splitMonthById(expenseId)

    let monthBudget = budget.find(item => Object.keys(item) == month) // || {[month]:finalSum}
    if(month) {
        budget = budget.filter(item => Object.keys(item) != month)

        try {
            let remainedMonthBudget = monthBudget[month] + amount
            if(remainedMonthBudget < 0)
                throw `budgetNegative`
        }
        catch {
            console.warn(`Warning! Expense is more than budget. The remained budget for this month: ${monthBudget[month]}`)
        }
        monthBudget[month] += amount
        budget.push(monthBudget)
        console.log(`${numberToMonth(`${month}`)} budget remaining: `,monthBudget[month]) // worked properly
        writeFile()
    }
}
function splitMonthById(expenseId) {
    let splitMonth = tracks.find(item => item.id == expenseId)?.date
    splitMonth = parseInt(splitMonth?.slice(5,7))
    return splitMonth
}
function splitMonthByDate(date) {
    let splitedMonth = parseInt(date?.slice(5,7))
    return splitedMonth
}
function substractPreviousExpensesFromNewSetBudget(month) {
    let currentMonth = splitMonthByDate(formattedDate())
    let currentMonthSum = summary(currentMonth)

    if(month == currentMonth) {
        // why this worked?
        budget.find(item => Object.keys(item) == currentMonth)[month] -= currentMonthSum
        let remainedBudget_substractingMonthBudget = budget.find(item => Object.keys(item) == currentMonth)[month]
        writeFile()
        try {
            if(remainedBudget_substractingMonthBudget < 0)
                throw `budgetNegative`
        }
        catch {
            console.warn(`Warning! Expense is more than budget. The remained budget for this month: $${remainedBudget_substractingMonthBudget}`)
        }

    }
}