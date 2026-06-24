import { Formik, Form, Field, ErrorMessage } from 'formik'
import { useState } from 'react'
import { apiFetch } from '../api.js'

export default function ShortenForm({ onShortened }) {
  const [shortenedUrl, setShortenedUrl] = useState('')
  const [showDialog, setShowDialog] = useState(false)

  const validate = (values) => {
    const errors = {}
    if (!values.longUrl) {
      errors.longUrl = 'Required'
    } else if (!/^https?:\/\//i.test(values.longUrl.trim())) {
      errors.longUrl = 'URL must start with http:// or https://'
    }
    return errors
  }

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const { longUrl } = values

    try {
      const requestData = { longUrl }

      const data = await apiFetch('/api/shorten', {
        method: 'POST',
        body: JSON.stringify(requestData),
      })

      setShortenedUrl(data.shortened_URL)
      resetForm()
      onShortened()
    } catch (err) {
      console.error('Error response:', err.response?.data)
      if (err.response?.data?.errors?.length) {
        showDialog('Errors: ' + err.response.data.errors.join(', '))
      } else {
        showDialog('shortening failed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form">
      <Formik
        initialValues={{ longUrl: '' }}
        validate={validate}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form id="longurl">
            <h3>Paste the URL to be shortened</h3>
            <div className="input-button">
              <Field
                className="input-form"
                type="url"
                name="longUrl"
                placeholder="Enter long URL"
                required
              />
              <button className="submit" type="submit" disabled={isSubmitting}>
                Shorten
              </button>
            </div>
            <ErrorMessage
              name="longUrl"
              component="div"
              style={{ color: 'red', marginTop: '4px' }}
            />

            <div className="p">
              <p>
                Short.ly is a free tool to shorten URLs and generate short
                links.
                <br />
                This URL shortener allows you to create a shortened link, making
                it easy to share.
              </p>
            </div>

            {shortenedUrl && (
              <div>
                <p>Shortened URL:</p>
                <a
                  href={shortenedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {shortenedUrl}
                </a>
              </div>
            )}
          </Form>
        )}
      </Formik>

      {showDialog && (
        <Dialog
          title="Invalid URL"
          message="Please include http:// or https:// in your URL."
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  )
}
