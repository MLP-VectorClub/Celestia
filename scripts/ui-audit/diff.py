#!/usr/bin/env python3
"""Compares the element inventories (headings, links, buttons, inputs) that capture.mjs wrote for the old site (wc) and Celestia (ce).

Usage: scripts/ui-audit/diff.py <dir with inventory.json> [page ...]
Labels are compared case-insensitively without icons or counters, so what shows up is a heading, link or button that exists on one site only.
"""
import json, re, sys

inv = json.load(open(sys.argv[1] + '/inventory.json'))
wanted = set(sys.argv[2:])

def norm(label):
    label = label.split(' -> ')[0]
    label = re.sub(r'[^\w ]+', ' ', label.lower())
    return re.sub(r'\s+', ' ', label).strip()

ROLES = ('guest', 'user', 'member', 'assistant', 'staff', 'admin', 'developer')
pages = sorted({k.rsplit('-', 2)[0] for k in inv})
for page in pages:
    if wanted and page not in wanted:
        continue
    for role in ROLES:
        wc, ce = inv.get(f'{page}-{role}-wc', {}), inv.get(f'{page}-{role}-ce', {})
        if 'error' in wc or 'error' in ce:
            print(f'## {page} ({role}): capture error', wc.get('error'), ce.get('error')); continue
        out = []
        for kind in ('h', 'buttons', 'links', 'inputs'):
            a = {norm(x) for x in wc.get(kind, []) if norm(x)}
            b = {norm(x) for x in ce.get(kind, []) if norm(x)}
            only_wc, only_ce = sorted(a - b), sorted(b - a)
            if only_wc: out.append(f'  {kind} only on the old site: {only_wc[:14]}')
            if only_ce: out.append(f'  {kind} only on Celestia:     {only_ce[:14]}')
        if wc.get('url') != ce.get('url'): out.append(f"  url: old {wc.get('url')}  vs  new {ce.get('url')}")
        print(f'## {page} ({role}): ' + ('same labels' if not out else ''))
        print('\n'.join(out))
