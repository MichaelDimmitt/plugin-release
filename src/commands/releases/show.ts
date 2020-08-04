import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {handleAppError, checkHerokuApi} from '../../helpers'

function releaseInfo(currentVersion: any, {created_at, user, id}: any) {
  return `
Release v:${currentVersion}
Start Date: ${created_at}
Author: ${user.email}
Id: ${id}`
}

function gatherReleaseInfo(body: any[]) {
  return body.slice(body.length - 20, body.length).reverse()
  .map((bodyElement: object, index: number) => {
    const currentVersion = ((body.length) - index)
    return `${releaseInfo(currentVersion, bodyElement)}`
  })
}

function logInfo(appName: any, body: any, herokuObject: any) {
  const name = appName.body.name
  herokuObject.log(
    `🤓  Application Name: ${name}
${body.length} most recent releases shown:
${gatherReleaseInfo(body).toString()}`)
}

// for future use: /apps/{app_id_or_name}/releases/{release_id_or_version}
export default class Show extends Command {
  static description = 'show latest releases for an app'

  static exampleCommand = 'heroku releases:show -a intense-crag-70741'

  static flags = {
    remote: flags.remote(),
    app: flags.app({required: true}),
  }

  async run() {
    checkHerokuApi(this.heroku, this.log)
    try {
      const {flags} = this.parse(Show)
      await Promise.all([
        this.heroku.get<Heroku.App>(`/apps/${flags.app}/`),
        this.heroku.get<Heroku.App>(`/apps/${flags.app}/releases/`),
      ]).then(([checkApp, queryRelease]) => {
        const appName = checkApp
        const {body}: any = queryRelease
        logInfo(appName, body, this)
      })
    } catch (error) {
      handleAppError(error, this.heroku, this.log)
    }
  }
}

