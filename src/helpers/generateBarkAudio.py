from bark import SAMPLE_RATE, generate_audio, preload_models
from scipy.io.wavfile import write as write_wav
from numpy import concatenate
import json
import sys
import os
import re

def strip_invalid_chars(s):
    return re.sub(r'[^a-zA-Z0-9_$]', '', s)


def linesToSpritemapWav(input_text_file, output_wav_file, output_js_file):
    # Initialize bark
    preload_models()

    # Set the sample rate and bit depth
    sample_rate = SAMPLE_RATE
    bit_depth = 16

    # Initialize the audio and JSON data
    audio_data = []
    json_data = {}
    total_length = 0
    history_prompt = "v2/en_speaker_4"
    temperature = 0.7

    # Open the input text file and read it line by line
    with open(input_text_file, 'r') as f:
        for i, line in enumerate(f):
            # Convert the line of text to audio using bark
            audio = generate_audio(line, history_prompt, temperature, 0.1)
            audio_data.append(audio)

            # Calculate the start time and duration of the audio
            start_time = total_length
            duration = len(audio) / (sample_rate * (bit_depth / 8)) * 1000  # milliseconds
            total_length += duration

            # Add the JSON data for this line
            lineText = line.strip().split(" ")
            worldDelimiter = "_"
            key = strip_invalid_chars(f'ln{i}${worldDelimiter.join(lineText[:3])}$tag')
            json_data[key] = [start_time, duration]

    # Concatenate the audio data into a single WAV file
    audio = concatenate(audio_data)

    write_wav(output_wav_file, sample_rate, audio)

    # Write the JSON data to a file
    #with open(output_json_file, 'w') as f:
    #    json.dump(json_data, f, indent=4)

    # Write the JSON data to a JS file
    with open(output_js_file, 'w') as f:
        f.write(f'export const spritemap = {json.dumps(json_data)};')


def main():
    # Get the input file name from sys.argv
    input_text_file = sys.argv[1]

    # Get the parent directory of the input file
    parent_dir = os.path.dirname(input_text_file)

    # Set the output file names
    output_wav_file = os.path.join(parent_dir, f'{os.path.splitext(os.path.basename(input_text_file))[0]}.wav')
    #output_json_file = os.path.join(parent_dir, f'{os.path.splitext(os.path.basename(input_text_file))[0]}.json')
    output_js_file = os.path.join(parent_dir, f'{os.path.splitext(os.path.basename(input_text_file))[0]}.js')

    # Call the linesToSpritemapWav function
    linesToSpritemapWav(input_text_file, output_wav_file, output_js_file)


if __name__ == '__main__':
    main()