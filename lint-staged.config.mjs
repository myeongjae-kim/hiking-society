const config = {
  '**/*.(mts|ts|tsx|js)': (filenames) => [`npx prettier --write ${filenames.join(' ')}`],
};

export default config;
