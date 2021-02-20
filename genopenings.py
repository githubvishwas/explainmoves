# -*- coding: utf-8 -*-
"""
Created on Sat Feb 20 02:06:09 2021

@author: Vishy
"""

infile = r"D:\mychesscoach\explainmoves\eco.pgn"
outfile = r"D:\mychesscoach\explainmoves\eco_openings.js"
file1 = open(infile, 'r') 
contents = file1.read()
file1.close()
file2 = open(outfile, 'w') 
tokens = contents.split('[Site')
file2.writelines("var eco_openings = []\n")
for i in tokens:
    black = ""
    moves = ""
    stokens = i.split(']')
    eco_code = stokens[0].replace('\"', '').strip()
    
    if len(stokens) < 3:
        continue
    
    ntokens = stokens[1].split('\"')
    white = ntokens[1].replace('\"', '')
    if len(stokens) == 4:
        ntokens = stokens[2].split('\"')
        black = ntokens[1].replace('\"', '')
        moves =  stokens[3].replace('\n', '').strip()
    else:
        moves =  stokens[2].strip() 
    file2.writelines("eco_openings.push({\"eco\":\"" + eco_code + "\",\"white\":\"" + white + "\",\"black\":\"" + black + "\",\"moves\":\"" + moves + "\"})\n")     
    #print('------------------------')    
    #print("ECO: " + eco_code)    
    #print("White: " + white)
    #print("Black: " + black)
    #print("Moves: " + moves)
file2.close()
   