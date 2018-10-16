import argparse, json, sys, binascii

parser = argparse.ArgumentParser(description='Preload a Geth genesis with contract accounts')

parser.add_argument('--rpc-endpoint', type=str, nargs='?',
                            help='URL for rpc endpoint')
parser.add_argument('--template', type=str, nargs='?',
                            help='path to the genesis source template')

parse_args = parser.parse_args()

template = parse_args.template
endpoint = parse_args.rpc_endpoint

try:
  with open(template) as f:
    template = f.read().replace('{rpcEndpoint}', endpoint)
    print(template)
except Exception as e:
  print(e)
  sys.exit(1)

