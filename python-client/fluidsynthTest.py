from mingus.core import notes, chords
from mingus.containers import *
from mingus.midi import fluidsynth

fluidsynth.init('./soundfonts/FluidR3_GM.sf2',"pulseaudio")

channel = 8
fluidsynth.play_Note(Note("C-4"), channel, 127)