@echo off
echo Renaming audio files for web compatibility...

REM Rename metronome files
ren "metronomes\ASRX UP.wav" "asrx-up.wav"
ren "metronomes\ASRX Down.wav" "asrx-down.wav"
ren "metronomes\3000 up.wav" "3000-up.wav"
ren "metronomes\3000 down.wav" "3000-down.wav"
ren "metronomes\SP1200 UP.wav" "sp1200-up.wav"
ren "metronomes\SP1200 Down.wav" "sp1200-down.wav"
ren "metronomes\Zoom ST UP.wav" "zoomst-up.wav"
ren "metronomes\Zoom ST Down .wav" "zoomst-down.wav"

REM Rename ambient files
ren "ambiences\Key of A Pads (sample).wav" "a.wav"
ren "ambiences\Key of Ab Pads (sample).wav" "gsharp.wav"
ren "ambiences\Key of B Pads (sample).wav" "b.wav"
ren "ambiences\Key of Bb Pads (sample).wav" "asharp.wav"
ren "ambiences\Key of C Pads (sample).wav" "c.wav"
ren "ambiences\Key of D Pads (sample).wav" "d.wav"
ren "ambiences\Key of Db Pads (sample).wav" "csharp.wav"
ren "ambiences\Key of E Pads (sample).wav" "e.wav"
ren "ambiences\Key of Eb Pads (sample).wav" "dsharp.wav"
ren "ambiences\Key of F Pads (sample).wav" "f.wav"
ren "ambiences\Key of G Pads (sample).wav" "g.wav"
ren "ambiences\Key of Gb Pads (sample).wav" "fsharp.wav"

echo Files renamed successfully!
pause
