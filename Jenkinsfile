pipeline {
  agent any
  options { ansiColor('xterm'); timestamps() }

  environment {
    APP_FE = "callmaker-frontend"
    APP_BE = "callmaker-backend"
    TAG    = "staging-${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        // kalau job kamu sudah "Pipeline from SCM", cukup:
        checkout scm
      }
    }

    // Opsional: build Node deps di host. Boleh dihapus kalau mau full build di Dockerfile.
    stage('Install Dependencies') {
      steps {
        dir('frontend') { bat 'npm ci || npm install' }
        dir('backend')  { bat 'npm ci || npm install' }
      }
    }

    // Opsional: build Vue di host. Kalau mau serahkan ke Dockerfile, hapus stage ini.
    stage('Build Vue App') {
      steps {
        dir('frontend') { bat 'npm run build' }
        // arsip dist supaya ada jejak build
        bat 'if not exist dist mkdir dist'
        bat 'xcopy /E /I /Y frontend\\dist dist\\frontend'
        archiveArtifacts artifacts: 'dist/frontend/**', fingerprint: true
      }
    }

    stage('Build Docker Images') {
      steps {
        bat 'docker build -t %APP_BE%:%TAG% ./backend'
        bat 'docker build -t %APP_FE%:%TAG% ./frontend'
      }
    }

    stage('Deploy Staging (docker compose)') {
      steps {
        bat '''
          docker compose -f docker-compose.staging.yml down || ver >NUL
          docker compose -f docker-compose.staging.yml build
          docker compose -f docker-compose.staging.yml up -d
          timeout /t 15 >NUL
          docker ps
        '''
      }
    }
  }

  post {
    success {
      echo "Staging up! Frontend: http://localhost:5173  |  Backend: http://localhost:5000"
    }
    failure {
      echo "❌ Build gagal, cek stage yang merah. Biasanya: Dockerfile path/compose."
    }
  }
}
