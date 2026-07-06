---
urn: 'urn:li:activity:7478081385371422720'
url: 'https://www.linkedin.com/feed/update/urn:li:activity:7478081385371422720/'
posted_at: '2026-07-01T13:45:38.306Z'
impressions: 94561
likes: 367
comments: 19
shares: 12
scraped_at: '2026-07-06T11:50:56.812Z'
---
Google's TabFM beats tuned XGBoost without training on your data.

That last part is the whole story. TabFM is a foundation model for tables. You hand it your dataset, it predicts in one forward pass. Its fit() call trains nothing. It just sets up encoders. The model already learned how tables behave.

From what? Hundreds of millions of synthetic datasets built from causal models. It never saw a real table in training. On TabArena, across 38 classification and 13 regression tasks, it beat heavily tuned gradient-boosted trees.

So the trees were never the problem. The tuning ritual was.

One catch. TabFM reads your whole dataset as a single prompt. The limit isn't how many rows you can train on. It's how many fit in context.

If yours fit, the week of hyperparameter tuning is optional now. It's on Hugging Face and GitHub. Run it against your own tables.

https://lnkd.in/gWXXMjxC

---

## Comments

**Stas Nevmyvaka**

> Curious if it still beats XGBoost when the table doesn't fit in context?

↳ **Teimur Gasanov**

>> Stas Nevmyvaka no, and that's the tell. Beyond the context limit you're back on XGBoost. Below it, the tuning step is the part you stop doing. It's a combination, not a replacement.

**Aaron Cooley**

> Google neither claimed nor showed any evidence that TabFM outperformed XGBoost or other tree-based prediction algorithms. They talked about how tabular foundation models eliminate the need for costly feature engineering and hyperparameter tuning, but then shared benchmarks only against other tabular foundation models.

↳ **Teimur Gasanov**

>> Aaron Cooley fair that the prose doesn't spell it out. But TabArena isn't foundation-models-only, its Elo runs across every class, tuned XGBoost and CatBoost included, so topping it means clearing the trees. The honest catch is it's Google's own eval, not reproduced yet on the public board, and the top score is the ensembled variant.

**Irfan Hussain**

> Was there a paper that showed outperformance vs XGBoost? The linked article did not.

↳ **Teimur Gasanov**

>> Irfan Hussain no standalone paper yet, just the blog, the repo, and the weights on Hugging Face. You're right the post doesn't lay out the XGBoost comparison. Those numbers sit in the repo's results folder, and the benchmark is TabArena, whose Elo already includes tuned trees.

**Abdullah Al Masud**

> Everyone is so hyped of new model that no one talks about the heavy token cost against the lightweight lowcost tree/boosting models, that too with substantial overfitting crisis

**Diogo Santos**

> The tuning ritual may be optional for some datasets, but the validation ritual definitely is not.
> 
> What changes is the bottleneck. Instead of spending a week tuning learning_rate and max_depth, you now need to ask: does the table fit in context, is the split realistic, is there leakage, are rare segments handled, and does the synthetic-data prior match the business process that generated this table?
> 
> So I’d read this less as “XGBoost is obsolete” and more as “baseline creation is getting compressed”. The real work moves closer to dataset understanding and failure-mode evaluation.

**Nicholas Ma**

> This is going to be stupidly expensive when using this at scale. Also you’re limited to the context window? Even a relatively modest dataset, say 20 columns and 100k rows, will not fit.

↳ **Teimur Gasanov**

>> Nicholas Ma the size wall is softer than it looks. The row-compression step is built for this, and the TabArena runs went up to 150k samples, so 100k rows isn't automatically out. You're right on the bill though.

**Mohamed A.**

> Splendid how it already knows how "tables" work. 
> So if I arrange stock prices in a table, can it predict the price in two weeks?

↳ **Teimur Gasanov**

>> Mohamed A. for that you'd want TimesFM, Google's time-series model, not TabFM.

**Vasileios Zografos, PhD**

> This post is somewhat misleading. Tabular models don't always outperform a well tuned GBT-variant model. And if they do they are very expensive inference time since they need the whole training set , which still needs to have engineered features and won't work from raw data. So the workaround is to distill with (ironically) a GBT model. 
> I would suggest to actually try to practically replicate these results before making bold claims like that - which people would naturally contest.

**Parag Dhingra**

> Any suggestions on how many rows of train data a 1 gb of memory can hold and what's the response time ?
> 
> Or any number on same lines from your experiments

↳ **Teimur Gasanov**

>> Parag Dhingra I haven't benchmarked memory per row myself, and it shifts with the data anyway, column count, dtypes, ensemble on or off. The number I'd trust is your own. On the larger TabArena tables (up to 150k rows) runs took hours per dataset before the bf16 speedup, so response time scales with size. The repo's results folder has per-fold timings to start from.

**Md Rounak Jahan Raj**

> This is fascinating. The idea of not having to do week-long work for hyperparameter tuning is really appealing. I would definitely look into the GitHub repo for TabFM for one of my predictive modeling.

**Naseem Machlovi**

> Ozkan Cigdem seems like a good fit for our radiomics project.

**Mohammed Shaikh**

> Gonna have to go play around with it now!

**Henri B.**

> Very cool

