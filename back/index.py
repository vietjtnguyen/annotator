#!/usr/bin/env python

'''index.py

Usage:
  ./index.py [options] <images_dirname> <db_filename>

Arguments:
  <images_dirname>  Path to folder containing the images.
  <db_filename>     Path to the sqlite3 database.

Options:
  -i, --ip          IP address to bind host to. [default: 0.0.0.0]
  -p, --port        Port to bind host to. [default: 8888]
'''

import ast
import pprint
import os
import os.path
import random
import sqlite3
import string
import sys

import numpy as np
from skimage.io import imread

#################################################################################

class Database():
  def __init__(self, file_name):
    self.connection = sqlite3.connect(file_name)
    self.cursor = self.connection.cursor()
  def tableExists(self, table_name):
    self.cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='?'", table_name)
    return len(self.cursor.fetchall()) > 0

db = Database()

#################################################################################

  for folder, subfolders, filenames in os.walk(label_dirname):
    for filename in filenames:
      print('  checking %s...' % os.path.join(folder, filename))
      label_filename = os.path.join(folder, filename)
      try:
        label_image = loadmat(label_filename)['Label']
      except KeyError:
        label_image = loadmat(label_filename)['LabelMap']
      for label_int in np.unique(label_image):
        try:
          label_images[label_names[label_int]].append((os.path.splitext(filename)[0], label_filename, folder))
        except IndexError:
          print('ERROR: Label index %d is out of range!' % label_int)
  print('caching index')
  pickle.dump(label_images, open('index.pickle', 'w'))

# Get label sets
print('collecting label sets')
label_sets = set()
for label_name in label_names:
  for image_name, label_filename, folder in label_images[label_name]:
    label_sets.add(folder)

# Get list of changes
if os.path.exists('changes.pickle'):
  print('change cache found, loading from cache')
  changes = pickle.load(open('changes.pickle', 'r'))
else:
  print('no change cache found')
  changes = {}
  pickle.dump(changes, open('changes.pickle', 'w'))
  
#################################################################################
## Server
#################################################################################

from index_template import index_template
from results_template import results_template

from flask import Flask, send_from_directory, request
app = Flask('Annotator')

@app.route('/')
def get_index():
  global label_names
  namespace = {'label_names': label_names}
  tmpl = index_template(searchList=[namespace])
  return str(tmpl)

@app.route('/change/<image_name>/<from_label>/to/', defaults={'to_label': ''})
@app.route('/change/<image_name>/<from_label>/to/<to_label>')
def change_label(image_name, from_label, to_label):
  global changes
  print('to_label = %s' % to_label)
  if to_label == '':
    if changes.has_key((image_name, from_label)):
      del changes[(image_name, from_label)]
  else:
    changes[(image_name, from_label)] = to_label
  pickle.dump(changes, open('changes.pickle', 'w'))
  return ''

@app.route('/regions/<path:filename>')
def get_image(filename):
  return send_from_directory(os.path.join(os.getcwd(), 'regions'), filename)

@app.route('/api/')
def get_label_examples(query_label):

#################################################################################

if __name__ == '__main__':

  from docopt import docopt
  args = docopt(__doc__, version='0.1')
  images_dirname = args['<images_dirname>']
  db_filename = args['<db_filename>']
  host_ip = args['--ip']
  host_port = int(args['--port'])

  app.run(host=host_ip, port=host_port, debug=True)

