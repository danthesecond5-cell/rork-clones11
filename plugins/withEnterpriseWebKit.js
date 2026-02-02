const fs = require('fs');
const path = require('path');
const {
  withDangerousMod,
  withXcodeProject,
  IOSConfig,
} = require('@expo/config-plugins');

function resolveFrameworkPath(projectRoot, frameworkPath) {
  if (!frameworkPath) {
    return null;
  }
  return path.isAbsolute(frameworkPath)
    ? frameworkPath
    : path.resolve(projectRoot, frameworkPath);
}

function copyFramework(sourcePath, destDir) {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    return null;
  }
  fs.mkdirSync(destDir, { recursive: true });
  const frameworkName = path.basename(sourcePath);
  const destPath = path.join(destDir, frameworkName);
  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true, force: true });
  }
  fs.cpSync(sourcePath, destPath, { recursive: true });
  return destPath;
}

function addFrameworkToProject(project, projectRoot, frameworkName, iosFrameworksDir) {
  const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
  const target = IOSConfig.XcodeUtils.getApplicationNativeTarget({
    project,
    projectName,
  });
  const frameworkRef = `${iosFrameworksDir}/${frameworkName}`;
  
  project.addFramework(frameworkRef, {
    customFramework: true,
    embed: true,
    link: true,
    target: target.uuid,
  });
}

const withEnterpriseWebKit = (config, props = {}) => {
  const frameworkPath = props.frameworkPath || 'enterprise/webkit/CustomWebKit.framework';
  const iosFrameworksDir = props.iosFrameworksDir || 'Frameworks';
  
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosRoot = config.modRequest.platformProjectRoot;
      const sourcePath = resolveFrameworkPath(projectRoot, frameworkPath);
      const destDir = path.join(iosRoot, iosFrameworksDir);
      copyFramework(sourcePath, destDir);
      return config;
    },
  ]);
  
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const frameworkName = path.basename(frameworkPath);
    addFrameworkToProject(project, config.modRequest.projectRoot, frameworkName, iosFrameworksDir);
    return config;
  });
  
  return config;
};

module.exports = withEnterpriseWebKit;
