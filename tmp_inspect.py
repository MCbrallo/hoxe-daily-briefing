import pandas as pd

df = pd.read_excel(r'C:\Users\34646\Downloads\april_on_this_day_database_2026.xlsx')
r = df.loc[0]
with open(r'C:\Users\34646\.gemini\antigravity\scratch\hoxe\tmp_row.txt', 'w', encoding='utf-8') as f:
    f.write(f"HEADLINE:\n{r['headline']}\n\n")
    f.write(f"DESCRIPTION:\n{r['description']}\n\n")
    f.write(f"VERIFICATION:\n{r['verification_notes']}\n\n")
    f.write(f"SIGNIFICANCE:\n{r['significance_level']}\n")
