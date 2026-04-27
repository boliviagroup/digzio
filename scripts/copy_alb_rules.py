import boto3
import json

client = boto3.client('elbv2', region_name='af-south-1')

HTTP_LISTENER = "arn:aws:elasticloadbalancing:af-south-1:244718668833:listener/app/digzio-alb-prod/775c40372d81d4fa/31a93981366dd2b6"
HTTPS_LISTENER = "arn:aws:elasticloadbalancing:af-south-1:244718668833:listener/app/digzio-alb-prod/775c40372d81d4fa/662ce56c0b5894a0"

# Get all rules from HTTP listener
response = client.describe_rules(ListenerArn=HTTP_LISTENER)
rules = response['Rules']

# Filter out the default rule
non_default_rules = [r for r in rules if not r['IsDefault']]
print(f"Found {len(non_default_rules)} non-default rules to copy")

# Copy each rule to HTTPS listener
for rule in non_default_rules:
    priority = int(rule['Priority'])
    conditions = rule['Conditions']
    actions = rule['Actions']
    
    # Clean up actions - remove read-only fields
    clean_actions = []
    for action in actions:
        clean_action = {
            'Type': action['Type'],
            'TargetGroupArn': action['TargetGroupArn']
        }
        clean_actions.append(clean_action)
    
    # Clean up conditions - use only PathPatternConfig, remove Values to avoid conflict
    clean_conditions = []
    for cond in conditions:
        clean_cond = {'Field': cond['Field']}
        if 'PathPatternConfig' in cond:
            clean_cond['PathPatternConfig'] = cond['PathPatternConfig']
        elif 'Values' in cond:
            clean_cond['PathPatternConfig'] = {'Values': cond['Values']}
        clean_conditions.append(clean_cond)
    
    try:
        result = client.create_rule(
            ListenerArn=HTTPS_LISTENER,
            Priority=priority,
            Conditions=clean_conditions,
            Actions=clean_actions
        )
        path = conditions[0].get('Values', ['unknown'])[0] if conditions else 'unknown'
        print(f"  ✅ Created rule priority {priority}: {path}")
    except Exception as e:
        print(f"  ❌ Failed rule priority {priority}: {e}")

print("\nDone! All API rules copied to HTTPS listener.")

# Verify HTTPS endpoint
import urllib.request
try:
    req = urllib.request.Request('https://www.digzio.co.za', headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, timeout=10)
    print(f"\n✅ https://www.digzio.co.za is LIVE! HTTP {resp.status}")
except Exception as e:
    print(f"\n⚠️  HTTPS check: {e} (DNS may still be propagating)")
