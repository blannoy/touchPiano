#pragma once

#define debug_begin(...)         \
  do                             \
  {                              \
    if (DEBUG)                   \
    {                            \
      Serial.begin(__VA_ARGS__); \
      while (!Serial)            \
        ;                        \
    }                            \
  } while (0)
#define debug_print(...)         \
  do                             \
  {                              \
    if (DEBUG)                   \
      Serial.print(__VA_ARGS__); \
  } while (0)
#define debug_println(...)         \
  do                               \
  {                                \
    if (DEBUG)                     \
      Serial.println(__VA_ARGS__); \
  } while (0)
#define debug_printf(...)  \
  do                       \
  {                        \
    if (DEBUG)             \
      printf(__VA_ARGS__); \
  } while (0)
#define debug_println_wait(...)    \
  do                               \
  {                                \
    if (DEBUG)                     \
      Serial.println(__VA_ARGS__); \
    delay(2000);                   \
  } while (0)
  
class RunningAverage 
{
  private:
  public:
    long total = 0;
    byte readingIndex = 0;
    long readings[NUMREADINGS];

    long getAverage(long value) {
      total = total - readings[readingIndex];
      readings[readingIndex] = value;
      total = total + readings[readingIndex];
      readingIndex = readingIndex + 1;
      if (readingIndex >= NUMREADINGS) {
        readingIndex = 0;
      }
      return total / NUMREADINGS;
    }
};