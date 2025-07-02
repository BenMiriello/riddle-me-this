import VersionCheck from '../VersionCheck'

const Footer = () => (
  <div className="fixed bottom-4 left-0 right-0 text-center z-10">
    <VersionCheck />
    <p className="text-xs text-gray-400">
      RiddleMeThis may accidentally give correct answers. Check important info.
    </p>
  </div>
)

export default Footer
