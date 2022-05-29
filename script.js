const formLKG = document.querySelector("#LKG_form");
const formLFSR = document.querySelector("#LFSR_form");
const nextArrow = document.querySelector(".next");
const prevArrow = document.querySelector(".prev");
const slidersItem = Array.from(document.querySelectorAll(`.slider section`));
const periodEl = document.querySelector(".period");
const variationEl = document.querySelector(".variation");

const ctxGeneratorChart = document
  .getElementById("generatorChart")
  .getContext("2d");
const ctx2BarChart = document.getElementById("BarChart").getContext("2d");

formLKG.addEventListener("submit", LKGFormSubmitHandler);
formLFSR.addEventListener("input", LFSRFormSubmitHandler);

const MAX_ITERATIONS = 1500;
let currentMaxGeneratedNumber = 0;
let currentMinGeneratedNumber = Infinity;
let distributionData = [];
let labels = [];

// =========== Generator LKG ===========
const generatorLKG = ({ a, c, m }) => {
  currentMaxGeneratedNumber = 0;
  const result = [];
  result[0] = { x: 0, y: 20 };
  if (result[0].y < currentMinGeneratedNumber)
    currentMinGeneratedNumber = result[0].y;
  for (let i = 1; i < MAX_ITERATIONS; i++) {
    const currentY = (a * result[i - 1].y + c) % m;
    if (currentMaxGeneratedNumber < currentY) {
      currentMaxGeneratedNumber = currentY;
    }
    if (currentMinGeneratedNumber > currentY) {
      currentMinGeneratedNumber = currentY;
    }
    result.push({
      x: i,
      y: currentY,
    });
  }
  return result;
};

let setttings = {
  a: 16807,
  c: 0,
  m: 2147483647,
};

let buffer = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0];
let links = [9, 4, 0];

// =========== Generator LFSR ===========
const generatorLFSR = (buffer, links) => {
  currentMaxGeneratedNumber = 0;
  const innerBuffer = buffer.slice();
  const innerLinks = links.slice();
  const result = [];
  for (let i = 1; i < MAX_ITERATIONS; i++) {
    let index;
    let newNum = 0;
    for (let j = 0; j < innerLinks.length; j++) {
      index = innerLinks[j];
      newNum += innerBuffer[index] + (i + j) * Math.PI.toFixed(0);
    }

    innerBuffer.pop();
    innerBuffer.unshift(newNum % 2);
    const bufferStr = innerBuffer.reduce((a, b) => {
      return a + b;
    }, "");

    if (currentMaxGeneratedNumber < parseInt(bufferStr, 2)) {
      currentMaxGeneratedNumber = parseInt(bufferStr, 2);
    }
    if (currentMinGeneratedNumber > parseInt(bufferStr, 2)) {
      currentMinGeneratedNumber = parseInt(bufferStr, 2);
    }

    result.push({
      x: i,
      y: parseInt(bufferStr, 2),
    });
  }
  return result;
};

// =========== Generator by Mersenne Twister (full implementation bellow) ===========

function MersenneTwisterGenerator() {
  const result = [];
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const currentY = genrand_int31();

    if (currentMaxGeneratedNumber < currentY)
      currentMaxGeneratedNumber = currentY;
    result.push({
      x: i,
      y: currentY,
    });
  }
  return result;
}

// =========== Graphic table ===========

function changeData(chart, newData, labels = null) {
  if (labels) {
    chart.data.labels = labels;
  }
  chart.data.datasets[0].data = newData;
  chart.update();
}

function setCurrentGeneratorData(slideNum) {
  switch (slideNum) {
    case 0:
      const newData = generatorLKG(setttings);
      calculateDistributionData(newData);
      changeData(generatorChart, newData);
      changeData(BarChart, distributionData, labels);
      updateAllTests(newData);
      break;
    case 1:
      const newData1 = generatorLFSR(buffer, links);
      calculateDistributionData(newData1);
      changeData(generatorChart, newData1);
      changeData(BarChart, distributionData, labels);
      updateAllTests(newData1);
      break;
    case 2:
      const newData2 = MersenneTwisterGenerator();
      calculateDistributionData(newData2);
      changeData(generatorChart, newData2);
      changeData(BarChart, distributionData, labels);
      updateAllTests(newData2);
      break;
  }
}

const dataGenerator = {
  datasets: [
    {
      label: "Результат работы генератора",
      data: [],
      backgroundColor: "rgb(29, 220, 29)",
    },
  ],
};

const generatorChart = new Chart(ctxGeneratorChart, {
  type: "scatter",
  data: dataGenerator,
  options: {
    scales: {
      x: {
        type: "linear",
        position: "bottom",
      },
    },
  },
});

const dataBar = {
  labels: labels,
  datasets: [
    {
      label: "Распределение велечин",
      data: distributionData,
      backgroundColor: ["rgb(0, 4, 255)"],
    },
  ],
};

const BarChart = new Chart(ctx2BarChart, {
  type: "bar",
  data: dataBar,
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

function LKGFormSubmitHandler(event) {
  event.preventDefault();
  const formChildren = event.target.elements;
  const inputValues = [formChildren.a, formChildren.c, formChildren.m].map(
    (input) => {
      let value = input.value;
      if (Number.isNaN(+value)) {
        if (~value.indexOf("^")) {
          return eval(value.replace("^", "**"));
        }
        return eval(value);
      }
      return +value;
    }
  );
  setttings = {
    a: inputValues[0],
    c: inputValues[1],
    m: inputValues[2],
  };
  const newData = generatorLKG(setttings);
  calculateDistributionData(newData);
  changeData(BarChart, distributionData, labels);
  changeData(generatorChart, newData);
  updateAllTests(newData);
}

function LFSRFormSubmitHandler(event) {
  const numberOfChangedInput = parseInt(event.target.name);
  const newVal = +event.target.value;
  if (event.target.name.includes("bit")) {
    buffer.splice(numberOfChangedInput, 1, newVal);
  } else {
    links.splice(numberOfChangedInput, 1, newVal);
  }
  const newData = generatorLFSR(buffer, links);
  calculateDistributionData(newData);
  changeData(BarChart, distributionData, labels);
  changeData(generatorChart, newData);
  updateAllTests(newData);
}

// =========== Shots table ===========
// const sheetIslands = document.querySelector(".isLand_sheet");

// let initialArray = [];
// let accuracy = 90;
// function makeRandomShots() {
//   for (let i = 0; i < 50; i++) {
//     initialArray[i] = [];
//     for (let j = 0; j < 50; j++) {
//       const randomValue = Math.random() * 100;
//       if (
//         randomValue < accuracy &&
//         (i - 25) ** 2 + (j - 25) ** 2 - 5 ** 2 <= 1
//       ) {
//         initialArray[i][j] = 1;
//       } else {
//         initialArray[i][j] = 0;
//       }
//     }
//   }
//   return initialArray;
// }

// makeRandomShots();

// for (let i = 0; i < 50; i++) {
//   for (let j = 0; j < 50; j++) {
//     const newNode = document.createElement("div");
//     if (initialArray[i][j] === 1) {
//       newNode.classList.add("black");
//     }
//     sheetIslands.appendChild(newNode);
//   }
// }

// =========== slider logic ===========

prevArrow.addEventListener("click", prevSlideHandler);
nextArrow.addEventListener("click", nextSlideHandler);

let currentSlideNumber = 0;
const MAXSLIDEVAL = 2;

function nextSlideHandler() {
  if (currentSlideNumber >= MAXSLIDEVAL) {
    return;
  }
  currentSlideNumber++;
  slidersItem.forEach((item) => {
    item.style.transform = `translateX(-${currentSlideNumber * 90}vw)`;
  });

  setCurrentGeneratorData(currentSlideNumber);
}

function prevSlideHandler() {
  if (currentSlideNumber <= 0) {
    return;
  }
  currentSlideNumber--;
  slidersItem.forEach((item) => {
    item.style.transform = `translateX(-${currentSlideNumber * 90}vw)`;
  });
  setCurrentGeneratorData(currentSlideNumber);
}

// =========== JavaScript version of Mersenne Twister ===========

N = 624;
M = 397;
MATRIX_A = 0x9908b0df; /* constant vector a */
UPPER_MASK = 0x80000000; /* most significant w-r bits */
LOWER_MASK = 0x7fffffff; /* least significant r bits */
//c//static unsigned long mt[N]; /* the array for the state vector  */
//c//static int mti=N+1; /* mti==N+1 means mt[N] is not initialized */
var mt = new Array(N); /* the array for the state vector  */
var mti = N + 1; /* mti==N+1 means mt[N] is not initialized */

function unsigned32(n1) {
  // returns a 32-bits unsiged integer from an operand to which applied a bit operator.
  return n1 < 0 ? (n1 ^ UPPER_MASK) + UPPER_MASK : n1;
}

function subtraction32(n1, n2) {
  // emulates lowerflow of a c 32-bits unsiged integer variable, instead of the operator -. these both arguments must be non-negative integers expressible using unsigned 32 bits.
  return n1 < n2 ? unsigned32((0x100000000 - (n2 - n1)) & 0xffffffff) : n1 - n2;
}

function addition32(n1, n2) {
  // emulates overflow of a c 32-bits unsiged integer variable, instead of the operator +. these both arguments must be non-negative integers expressible using unsigned 32 bits.
  return unsigned32((n1 + n2) & 0xffffffff);
}

function multiplication32(n1, n2) {
  // emulates overflow of a c 32-bits unsiged integer variable, instead of the operator *. these both arguments must be non-negative integers expressible using unsigned 32 bits.
  var sum = 0;
  for (var i = 0; i < 32; ++i) {
    if ((n1 >>> i) & 0x1) {
      sum = addition32(sum, unsigned32(n2 << i));
    }
  }
  return sum;
}

/* initializes mt[N] with a seed */
//c//void init_genrand(unsigned long s)
function init_genrand(s) {
  //c//mt[0]= s & 0xffffffff;
  mt[0] = unsigned32(s & 0xffffffff);
  for (mti = 1; mti < N; mti++) {
    mt[mti] =
      //c//(1812433253 * (mt[mti-1] ^ (mt[mti-1] >> 30)) + mti);
      addition32(
        multiplication32(
          1812433253,
          unsigned32(mt[mti - 1] ^ (mt[mti - 1] >>> 30))
        ),
        mti
      );
    /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
    /* In the previous versions, MSBs of the seed affect   */
    /* only MSBs of the array mt[].                        */
    /* 2002/01/09 modified by Makoto Matsumoto             */
    //c//mt[mti] &= 0xffffffff;
    mt[mti] = unsigned32(mt[mti] & 0xffffffff);
    /* for >32 bit machines */
  }
}

/* initialize by an array with array-length */
/* init_key is the array for initializing keys */
/* key_length is its length */
/* slight change for C++, 2004/2/26 */
//c//void init_by_array(unsigned long init_key[], int key_length)
function init_by_array(init_key, key_length) {
  //c//int i, j, k;
  var i, j, k;
  init_genrand(19650218);
  i = 1;
  j = 0;
  k = N > key_length ? N : key_length;
  for (; k; k--) {
    //c//mt[i] = (mt[i] ^ ((mt[i-1] ^ (mt[i-1] >> 30)) * 1664525))
    //c//	+ init_key[j] + j; /* non linear */
    mt[i] = addition32(
      addition32(
        unsigned32(
          mt[i] ^
            multiplication32(
              unsigned32(mt[i - 1] ^ (mt[i - 1] >>> 30)),
              1664525
            )
        ),
        init_key[j]
      ),
      j
    );
    mt[i] =
      //c//mt[i] &= 0xffffffff; /* for WORDSIZE > 32 machines */
      unsigned32(mt[i] & 0xffffffff);
    i++;
    j++;
    if (i >= N) {
      mt[0] = mt[N - 1];
      i = 1;
    }
    if (j >= key_length) j = 0;
  }
  for (k = N - 1; k; k--) {
    //c//mt[i] = (mt[i] ^ ((mt[i-1] ^ (mt[i-1] >> 30)) * 1566083941))
    //c//- i; /* non linear */
    mt[i] = subtraction32(
      unsigned32(
        (dbg = mt[i]) ^
          multiplication32(
            unsigned32(mt[i - 1] ^ (mt[i - 1] >>> 30)),
            1566083941
          )
      ),
      i
    );
    //c//mt[i] &= 0xffffffff; /* for WORDSIZE > 32 machines */
    mt[i] = unsigned32(mt[i] & 0xffffffff);
    i++;
    if (i >= N) {
      mt[0] = mt[N - 1];
      i = 1;
    }
  }
  mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */
}

/* generates a random number on [0,0xffffffff]-interval */
//c//unsigned long genrand_int32(void)
function genrand_int32() {
  //c//unsigned long y;
  //c//static unsigned long mag01[2]={0x0UL, MATRIX_A};
  var y;
  var mag01 = new Array(0x0, MATRIX_A);
  /* mag01[x] = x * MATRIX_A  for x=0,1 */

  if (mti >= N) {
    /* generate N words at one time */
    //c//int kk;
    var kk;

    if (mti == N + 1)
      /* if init_genrand() has not been called, */
      init_genrand(5489); /* a default initial seed is used */

    for (kk = 0; kk < N - M; kk++) {
      //c//y = (mt[kk]&UPPER_MASK)|(mt[kk+1]&LOWER_MASK);
      //c//mt[kk] = mt[kk+M] ^ (y >> 1) ^ mag01[y & 0x1];
      y = unsigned32((mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK));
      mt[kk] = unsigned32(mt[kk + M] ^ (y >>> 1) ^ mag01[y & 0x1]);
    }
    for (; kk < N - 1; kk++) {
      //c//y = (mt[kk]&UPPER_MASK)|(mt[kk+1]&LOWER_MASK);
      //c//mt[kk] = mt[kk+(M-N)] ^ (y >> 1) ^ mag01[y & 0x1];
      y = unsigned32((mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK));
      mt[kk] = unsigned32(mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 0x1]);
    }
    //c//y = (mt[N-1]&UPPER_MASK)|(mt[0]&LOWER_MASK);
    //c//mt[N-1] = mt[M-1] ^ (y >> 1) ^ mag01[y & 0x1];
    y = unsigned32((mt[N - 1] & UPPER_MASK) | (mt[0] & LOWER_MASK));
    mt[N - 1] = unsigned32(mt[M - 1] ^ (y >>> 1) ^ mag01[y & 0x1]);
    mti = 0;
  }

  y = mt[mti++];

  /* Tempering */
  //c//y ^= (y >> 11);
  //c//y ^= (y << 7) & 0x9d2c5680;
  //c//y ^= (y << 15) & 0xefc60000;
  //c//y ^= (y >> 18);
  y = unsigned32(y ^ (y >>> 11));
  y = unsigned32(y ^ ((y << 7) & 0x9d2c5680));
  y = unsigned32(y ^ ((y << 15) & 0xefc60000));
  y = unsigned32(y ^ (y >>> 18));

  return y;
}

/* generates a random number on [0,0x7fffffff]-interval */
//c//long genrand_int31(void)
function genrand_int31() {
  //c//return (genrand_int32()>>1);
  return genrand_int32() >>> 1;
}

// =========== Testing functions ===========

function updateAllTests(data) {
  periodHandler(data);
  variationHandler(data);
}

function periodHandler(data) {
  const { period, hasPeriod } = periodTest(data);
  if (hasPeriod) {
    periodEl.textContent = period;
  } else {
    periodEl.textContent = `>${MAX_ITERATIONS}`;
  }
}

function variationHandler(data) {
  variationEl.textContent = variationCoefficientTest(data) + "%";
}

function periodTest(data) {
  const firstElement = data[1].y;
  const lastlElement = data[data.length - 1].y;
  const middlElement = data[Math.floor(data.length / 2)].y;
  let hasPeriod = false;
  let period = MAX_ITERATIONS;
  for (let i = 2; i < data.length - 1; i++) {
    if (firstElement === data[i].y) {
      hasPeriod = true;
      period = i - 1;
      break;
    }
  }
  for (let i = data.length - 2; i > 0; i--) {
    if (lastlElement === data[i].y) {
      hasPeriod = true;
      period = data.length - i;
      break;
    }
  }
  for (let i = Math.floor(data.length / 2) + 1; i < data.length; i++) {
    if (middlElement === data[i].y) {
      hasPeriod = true;
      period = i - Math.floor(data.length / 2);
      break;
    }
  }

  return {
    hasPeriod,
    period,
  };
}
function correlationCoefficientTest(data) {
  let divisible = 0;
  let divider1 = 0;
  let divider2 = 0;

  let averageX =
    (MAX_ITERATIONS ** 2 - 1 ** 2 + 1 + MAX_ITERATIONS) / (2 * MAX_ITERATIONS);

  const { y: summOfNumber } = data.reduce(({ y: a }, { y: b }) => {
    return { y: a + b };
  });

  let averageY = summOfNumber / data.length;

  for (let x = 0; x < data.length - 1; x++) {
    const y = data[x].y;
    divisible += (x - averageX) * (y - averageY);
    divider1 += (x - averageX) ** 2;
    divider2 += (y - averageY) ** 2;
  }

  return divisible / Math.sqrt(divider1 * divider2);
}

function variationCoefficientTest(data) {
  let divisible = 0;
  const { y: summOfNumber } = data.reduce(({ y: a }, { y: b }) => {
    return { y: a + b };
  });

  let averageY = (summOfNumber / data.length).toFixed(5);

  for (let i = 0; i < data.length; i++) {
    const element = data[i].y;
    divisible += (element - averageY) ** 2;
  }
  const result = (
    (Math.sqrt(divisible / MAX_ITERATIONS) / averageY) *
    100
  ).toFixed(0);
  return result;
}
// =========== Bar chart funciton ===========
function calculateDistributionData(generatedData) {
  const quantityOfColumns = 500;
  const step = currentMaxGeneratedNumber / quantityOfColumns;
  initialLabels(step, currentMinGeneratedNumber, currentMaxGeneratedNumber);

  for (let i = 0; i < quantityOfColumns; i++) {
    distributionData[i] = 0;
  }

  for (let i = 0; i < quantityOfColumns; i++) {
    const element = generatedData[i].y;
    distributionData[(element / step).toFixed(0)]++;
  }
}

function initialLabels(step, firstElement, lastlElement) {
  labels.length = 0;
  for (let i = firstElement; i < lastlElement; i += step) {
    labels.push(`${i.toFixed(0)}-${(i + step).toFixed(0)}`);
  }
}
// =========== Initialization ===========
setCurrentGeneratorData(0);
