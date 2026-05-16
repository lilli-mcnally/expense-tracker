import incomeModel from "../models/incomeModels.js";
import expenseModel from "../models/expenseModel.js";

export async function getDashboardOverview(req,res){
    const userId = req.user._id
    const now = new Date();
    const startofMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
        const incomes = await incomeModel.find({
            userId,
            date: { $gte: startofMonth, $lte: now },
        }).lean();

        const expenses = await expenseModel.find({
            userId,
            date: { $gte: startofMonth, $lte: now },
        }).lean();

        
        // calcs the total amount for this months incomes
        const monthlyIncome = incomes.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
        // calcs the total amount for this months expenses
        const monthlyExpense = expenses.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
        // works out how much was left over as savings
        const savings = monthlyIncome - monthlyExpense;
        // calcs how much of the income was saved as a percentage
        const savingsRate = monthlyIncome === 0 ? 0 : Math.round((savings / monthlyIncome) * 100);

        // extracts the data from the income and expenses folder and tags them as either an income or an expense
        const recentTransactions = [
            ...incomes.map((i) => ({ ...i, type: "income" })),
            ...expenses.map((e) => ({ ...e, type: "expense" })),
        /* picks two at random and figures out which is older based on creation date
        until the whole pile is sorted in date order */
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const spendByCategory = {};
        for (const exp of expenses) {
            // if each expense doesn't have a category, list category as "other"
            const cat = exp.category || "Other";
            /* check if the category has been created yet, and if it hasn't then the spend is 0
                and if it has, add the expense amount to the category total amount */
            spendByCategory[cat] = (spendByCategory[cat] || 0) + Number(exp.amount || 0);
        }

        // this changes the formats the data so it can be displayed as a chart
        const expenseDistribution = Object.entries(spendByCategory).map(([category, amount]) => ({
            category,
            amount,
            percent: monthlyExpense === 0 ? 0 : Math.round((amount / monthlyExpense) * 100),
        }));

        return res.status(200).json({
            success: true,
            data: {
                monthlyIncome,
                monthlyExpense,
                savings,
                savingsRate,
                recentTransactions,
                spendByCategory,
                expenseDistribution
            }
        })

    } catch (err) {
        console.error("GetDashboardOverview Error:", err);
        return res.status(500).json({
            success: false,
            message: "Dashboard Fetch failed"
        })
        
    }

}