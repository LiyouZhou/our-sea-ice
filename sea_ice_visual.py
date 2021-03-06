import json
from json import encoder
from netCDF4 import Dataset
import matplotlib.pyplot as plt
import datetime as dt

data_dir = "json/sea-ice/"
#nci = Dataset('data/ice-cores/Burkhart_JGR_2009.nc', 'r')

sid = Dataset('data/sea-ice/Bootstrap2_seaice_NH_monthly_197811-201412.nc', 'r')
sic_mean = sid.variables['sic_mean']
time = sid.variables['time']
basetime = dt.datetime.strptime(" ".join(time.units.split()[-2:]), "%Y-%m-%d %H:%M:%S")
epoch_since = dt.datetime(1970,1,1)
time_offset = basetime - epoch_since;
lat = sid.variables['lat']
lon = sid.variables['lon']

with open(data_dir+"lat.json", 'w') as fd:
	fd.write(json.dumps(lat[0:].tolist()))

with open(data_dir+"lon.json", 'w') as fd:
	fd.write(json.dumps(lon[0:].tolist()))

with open(data_dir+"time.json", 'w') as fd:
	time_list = time[0:].tolist()
	time_list = [(time_offset+dt.timedelta(days=x)).total_seconds() for x in time_list]
	fd.write(json.dumps(time_list))

def json_float_formatter(o):
	s = format(o, '.2f')
	if float(s) != 0:
		return s
	else:
		return "0"

import numpy as np

lonDelta = (lon[1]-lon[0])*4.5
latDelta = (lat[1]-lat[0])*4.5

encoder.FLOAT_REPR = json_float_formatter
json.encoder.c_make_encoder = None
for i, t in enumerate(time):
	d = [];
	for j, x in enumerate(lat):
		if j%10 == 0:
			for k, y in enumerate(lon):
				if k%10 == 0:
					try:
						v = np.sum(sic_mean[i,0,j:j+9,k:k+9].filled(0))
					except AttributeError:
						v = np.sum(sic_mean[i,0,j:j+9,k:k+9])
					if v != 0:
						d.append([v/100, x+latDelta, y+lonDelta])

	with open(data_dir+str(int(i))+".json", 'w') as fd:
	 	fd.write(json.dumps(d, separators=(',',':')))
	print i, t

# len(nci.groups)
# nci.groups.keys()
# arbitrary_key = list(nci.groups.keys())[0]
# nci.groups[arbitrary_key]

# core = nci.groups['sum99']

# # core.siteid
# # core.name
# # core.longitude
# # core.latitude
# core.variables.keys()

# conc = core.variables['conc']
# print(conc.units)
# print(conc.description)
# list(conc)[0:9]

# x = core.variables['year']
# y1 = core.variables['conc']
# y2 = core.variables['flux']

# fig = plt.figure(figsize=(16, 12))

# plt.subplot(2,1,1)
# plt.plot(x, y1)
# plt.ylabel('{0} / {1}'.format(y1.description, y1.units))
# plt.title('Ice core {0}'.format(core.name))

# plt.subplot(2,1,2)
# plt.plot(x, y2)
# plt.ylabel('{0} / {1}'.format(y2.description, y2.units))
# plt.xlabel('Year')

# # plt.savefig('sum99_conc_flux_plot')
# plt.show()